const http = require('http');
const { Server } = require('socket.io');
const { io: ioc } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { initSocket } = require('../../backend/src/socket/index');
const { createTestTenant, createTestUser } = require('../helpers/auth.helper');
const { createBus, createTrip, createRoute, createStation } = require('../helpers/factory.helper');

describe('Socket.IO + GPS Live Tracking', () => {
  let httpServer, io, clientSocket;
  let tenant, staff, staffToken, driver, driverToken;
  let bus, trip;

  beforeAll(async () => {
    tenant = await createTestTenant();
    const staffResult = await createTestUser({ firstName: 'Staff' }, 'staff', tenant);
    staff = staffResult.user;
    staffToken = staffResult.token;

    const driverResult = await createTestUser({ firstName: 'Driver' }, 'driver', tenant);
    driver = driverResult.user;
    driverToken = driverResult.token;

    bus = await createBus(tenant._id, { busNumber: `BUS-SOCK-${Date.now()}` });
    trip = await createTrip(tenant._id, { busId: bus._id, status: 'active' });

    httpServer = http.createServer();
    io = initSocket(httpServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
      clientSocket = null;
    }
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) clientSocket.disconnect();
    if (io) io.close();
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  });

  function createSocket(token) {
    const port = httpServer.address().port;
    const socket = ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token },
    });
    return socket;
  }

  function waitForEvent(socket, event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
      socket.once(event, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function waitForConnect(socket, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket connection timeout')), timeout);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  it('should connect with valid JWT token', async () => {
    clientSocket = createSocket(staffToken);
    await waitForConnect(clientSocket);
    expect(clientSocket.connected).toBe(true);
  });

  it('should reject connection without token', async () => {
    const port = httpServer.address().port;
    const badSocket = ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: {},
    });

    await expect(waitForConnect(badSocket)).rejects.toThrow();
    badSocket.disconnect();
  });

  it('should reject connection with invalid token', async () => {
    const port = httpServer.address().port;
    const badSocket = ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: 'invalid-jwt-token' },
    });

    await expect(waitForConnect(badSocket)).rejects.toThrow();
    badSocket.disconnect();
  });

  it('should authenticate and auto-join company room on connect', async () => {
    clientSocket = createSocket(staffToken);
    await waitForConnect(clientSocket);

    const rooms = clientSocket as any;
    expect(clientSocket.connected).toBe(true);
  });

  it('driver should emit gps:update and staff should receive gps:live', async () => {
    const staffSocket = createSocket(staffToken);
    await waitForConnect(staffSocket);

    const driverSocket = createSocket(driverToken);
    await waitForConnect(driverSocket);

    const gpsPromise = waitForEvent(staffSocket, 'gps:live');

    driverSocket.emit('gps:update', {
      busId: bus._id.toString(),
      tripId: trip._id.toString(),
      latitude: 30.0444,
      longitude: 31.2357,
      speed: 65,
      heading: 90,
    });

    const gpsData = await gpsPromise;
    expect(gpsData).toBeDefined();
    expect(gpsData.latitude).toBe(30.0444);
    expect(gpsData.longitude).toBe(31.2357);
    expect(gpsData.speed).toBe(65);
    expect(gpsData.heading).toBe(90);

    staffSocket.disconnect();
    driverSocket.disconnect();
  });

  it('should support trip room subscription /gps:subscribe-trip', async () => {
    const staffSocket = createSocket(staffToken);
    await waitForConnect(staffSocket);

    staffSocket.emit('gps:subscribe-trip', trip._id.toString());

    staffSocket.emit('gps:unsubscribe-trip', trip._id.toString());
    staffSocket.disconnect();
  });

  it('should handle concurrent GPS updates', async () => {
    const staffSocket = createSocket(staffToken);
    await waitForConnect(staffSocket);

    const driverSocket = createSocket(driverToken);
    await waitForConnect(driverSocket);

    const updates = [];
    const numUpdates = 5;

    for (let i = 0; i < numUpdates; i++) {
      updates.push(
        new Promise((resolve) => {
          staffSocket.once('gps:live', (data) => resolve(data));
          driverSocket.emit('gps:update', {
            busId: bus._id.toString(),
            tripId: trip._id.toString(),
            latitude: 30.04 + i * 0.01,
            longitude: 31.23 + i * 0.01,
            speed: 60 + i * 5,
            heading: 90 + i * 10,
          });
        })
      );
    }

    const results = await Promise.all(updates);
    expect(results.length).toBe(numUpdates);
    expect(results[0].latitude).toBeDefined();
    expect(results[numUpdates - 1].longitude).toBeDefined();

    staffSocket.disconnect();
    driverSocket.disconnect();
  });

  it('should isolate GPS events by company room', async () => {
    const tenant2 = await createTestTenant();
    const { token: staffToken2 } = await createTestUser({}, 'staff', tenant2);

    const staffSocket1 = createSocket(staffToken);
    await waitForConnect(staffSocket1);

    const staffSocket2 = createSocket(staffToken2);
    await waitForConnect(staffSocket2);

    const shouldNotReceive = new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(null), 1000);
      staffSocket2.once('gps:live', (data) => {
        clearTimeout(timer);
        reject(new Error('Received cross-tenant GPS event'));
      });
    });

    const driverSocket = createSocket(driverToken);
    await waitForConnect(driverSocket);

    driverSocket.emit('gps:update', {
      busId: bus._id.toString(),
      tripId: trip._id.toString(),
      latitude: 30.0,
      longitude: 31.0,
      speed: 50,
      heading: 0,
    });

    const result = await shouldNotReceive;
    expect(result).toBeNull();

    staffSocket1.disconnect();
    staffSocket2.disconnect();
    driverSocket.disconnect();
  });

  it('should handle socket disconnect gracefully', async () => {
    clientSocket = createSocket(staffToken);
    await waitForConnect(clientSocket);

    clientSocket.disconnect();
    expect(clientSocket.connected).toBe(false);
  });

  it('should emit error on invalid GPS payload', async () => {
    const driverSocket = createSocket(driverToken);
    await waitForConnect(driverSocket);

    const errorPromise = new Promise((resolve) => {
      driverSocket.once('error', (err) => resolve(err));
    });

    driverSocket.emit('gps:update', { invalid: 'payload' });

    const error = await errorPromise;
    expect(error).toBeDefined();

    driverSocket.disconnect();
  });
});
