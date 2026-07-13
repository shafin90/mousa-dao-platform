const request = require('supertest');
const app = require('../../backend/src/app');
const jwt = require('jsonwebtoken');
const { createTestTenant, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBooking, createPayment, createTicket } = require('../helpers/factory.helper');

function validateSchema(body, schemaShape) {
  for (const [key, type] of Object.entries(schemaShape)) {
    if (type === 'optional') continue;
    if (body[key] === undefined || body[key] === null) {
      throw new Error(`Missing required field: ${key}`);
    }
    if (type === 'array' && !Array.isArray(body[key])) {
      throw new Error(`Expected array for: ${key}`);
    }
    if (type === 'object' && typeof body[key] !== 'object') {
      throw new Error(`Expected object for: ${key}`);
    }
  }
}

describe('Mobile App ↔ Backend Integration', () => {
  let customer, customerToken, tenant;
  let stations, route, bus, trip, booking, payment, ticket;

  beforeAll(async () => {
    tenant = await createTestTenant();
    const result = await createTestUser({ firstName: 'Ahmed', lastName: 'User' }, 'customer', tenant);
    customer = result.user;
    customerToken = result.token;
  });

  it('Step 1: Register a new customer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Mobile User',
        email: `mobile-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        role: 'customer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('customer');

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(decoded.id).toBeDefined();
    expect(decoded.role).toBe('customer');
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('Step 2: Login as customer returns JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: customer.email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(customer.email);

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(decoded.companyId).toBe(tenant._id.toString());
  });

  it('Step 3: GET stations returns all stations', async () => {
    stations = [
      await createStation(tenant._id, { name: 'Cairo Main', lat: 30.0444, lng: 31.2357 }),
      await createStation(tenant._id, { name: 'Alexandria', lat: 31.2001, lng: 29.9187 }),
      await createStation(tenant._id, { name: 'Luxor', lat: 25.6872, lng: 32.6396 }),
    ];

    const res = await request(app)
      .get('/api/v1/stations')
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);

    for (const s of res.body.data) {
      validateSchema(s, { _id: 'string', name: 'string', location: 'object' });
    }
  });

  it('Step 4: GET trips returns available trips', async () => {
    route = await createRoute(tenant._id, {
      fromStation: stations[0]._id,
      toStation: stations[1]._id,
      baseFare: 100,
    });
    bus = await createBus(tenant._id, { capacity: 40, busNumber: `BUS-MOB-${Date.now()}` });
    trip = await createTrip(tenant._id, {
      routeId: route._id,
      busId: bus._id,
      price: 100,
      seatsTotal: 40,
      date: new Date(Date.now() + 86400000),
    });

    await createTrip(tenant._id, {
      routeId: route._id,
      busId: bus._id,
      price: 150,
      seatsTotal: 40,
      departureTime: '14:00',
      arrivalTime: '18:00',
      date: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .get('/api/v1/trips')
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('Step 5: GET trip details by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${trip._id}`)
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(trip._id.toString());
    expect(res.body.data.price).toBe(100);
    expect(res.body.data.seatsTotal).toBe(40);
  });

  it('Step 6: Create booking (async via queue)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', getAuthHeader(customerToken))
      .send({ tripId: trip._id.toString(), seats: ['A1', 'A2'] });

    expect(res.status).toBe(202);
    expect(res.body.data.eventId).toBeDefined();
  });

  it('Step 7: Create a booking directly for payment test', async () => {
    booking = await createBooking(tenant._id, customer._id, trip._id, {
      seats: ['B1'],
      totalAmount: 100,
      status: 'confirmed',
      paymentStatus: 'unpaid',
    });

    const res = await request(app)
      .get(`/api/v1/bookings/${booking._id}`)
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.paymentStatus).toBe('unpaid');
    expect(res.body.data.totalAmount).toBe(100);
  });

  it('Step 8: Initiate payment', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', getAuthHeader(customerToken))
      .send({ bookingId: booking._id.toString(), method: 'flutterwave' });

    expect(res.status).toBe(202);
    expect(res.body.data.tx_ref).toBeDefined();
  });

  it('Step 9: Create payment and verify it exists', async () => {
    payment = await createPayment(tenant._id, customer._id, booking._id, {
      amount: 100,
      status: 'success',
      method: 'flutterwave',
    });

    const res = await request(app)
      .get('/api/v1/payments/my')
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('success');
  });

  it('Step 10: Get ticket after payment', async () => {
    ticket = await createTicket(tenant._id, customer._id, booking._id, trip._id, {
      ticketNumber: `TKT-MOB-${Date.now()}`,
      status: 'valid',
    });

    const res = await request(app)
      .get('/api/v1/tickets/my')
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].ticketNumber).toBe(ticket.ticketNumber);
    expect(res.body.data[0].status).toBe('valid');
    expect(res.body.data[0].qrCode).toBeDefined();
  });

  it('Step 11: Get ticket details by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${ticket._id}`)
      .set('Authorization', getAuthHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.ticketNumber).toBe(ticket.ticketNumber);
    expect(res.body.data.qrCode).toBeDefined();
  });

  it('Step 12: Verify all status codes and response schemas', async () => {
    const endpoints = [
      { method: 'get', path: '/api/v1/stations' },
      { method: 'get', path: '/api/v1/trips' },
      { method: 'get', path: `/api/v1/trips/${trip._id}` },
      { method: 'get', path: '/api/v1/bookings/my' },
      { method: 'get', path: '/api/v1/payments/my' },
      { method: 'get', path: '/api/v1/tickets/my' },
    ];

    for (const ep of endpoints) {
      const res = await request(app)
        [ep.method](ep.path)
        .set('Authorization', getAuthHeader(customerToken));

      expect([200, 202].includes(res.status)).toBe(true);
      expect(res.body.success).toBe(true);
    }
  });

  it('Step 13: Verify auth required for all protected endpoints', async () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/v1/stations' },
      { method: 'get', path: '/api/v1/trips' },
      { method: 'get', path: '/api/v1/bookings/my' },
      { method: 'get', path: '/api/v1/payments/my' },
      { method: 'get', path: '/api/v1/tickets/my' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await request(app)
        [ep.method](ep.path);

      expect(res.status).toBe(401);
    }
  });
});
