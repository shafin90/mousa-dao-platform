const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { handleGpsUpdate } = require('../modules/tracking/socket/gps.socket.handler');

let io = null;

/**
 * Initializes Socket.IO server with JWT auth and event handlers.
 *
 * FLOW:
 * 1. Create Socket.IO server with CORS config
 * 2. Apply JWT auth middleware on connection (extracts companyId, role)
 * 3. On 'gps:update' → delegate to gps.socket.handler
 * 4. On 'gps:subscribe-trip' → join trip room
 * 5. On 'gps:unsubscribe-trip' → leave trip room
 *
 * INPUT:
 * @param {Object} httpServer - Node HTTP server instance
 *
 * OUTPUT:
 * @returns {Object} Socket.IO server instance
 *
 * SIDE EFFECTS:
 * - Attaches auth context to each socket (userId, companyId, role)
 * - Creates company:{companyId} and trip:{tripId} rooms
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.companyId) return next(new Error('Tenant context required'));

      socket.userId = decoded.id;
      socket.companyId = decoded.companyId;
      socket.role = decoded.role;
      socket.join(`company:${decoded.companyId}`);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('gps:update', async (data) => {
      try {
        await handleGpsUpdate(socket, data);
      } catch (error) {
        socket.emit('error', { message: error.message, code: error.code });
      }
    });

    socket.on('gps:subscribe-trip', (tripId) => {
      if (tripId) socket.join(`trip:${tripId}`);
    });

    socket.on('gps:unsubscribe-trip', (tripId) => {
      if (tripId) socket.leave(`trip:${tripId}`);
    });
  });

  return io;
};

/**
 * Returns the active Socket.IO instance.
 *
 * @returns {Object} Socket.IO server
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

/**
 * Emits an event to all sockets in a company room.
 *
 * @param {string} companyId
 * @param {string} event
 * @param {*} data
 */
const emitToCompany = (companyId, event, data) => {
  if (io) io.to(`company:${companyId}`).emit(event, data);
};

/**
 * Emits an event to all sockets in a trip room.
 *
 * @param {string} tripId
 * @param {string} event
 * @param {*} data
 */
const emitToTrip = (tripId, event, data) => {
  if (io) io.to(`trip:${tripId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToCompany, emitToTrip };
