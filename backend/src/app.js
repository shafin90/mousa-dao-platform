const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files (bus photos, etc.). CORP header lets the frontend
// (served from a different origin/port) load these images via <img>.
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/routes', require('./modules/trips/route.routes'));
app.use('/api/v1/trips', require('./modules/trips/trip.routes'));
app.use('/api/v1/bookings', require('./modules/bookings/booking.routes'));
app.use('/api/v1/payments', require('./modules/payments/payment.routes'));
app.use('/api/v1/refund-requests', require('./modules/payments/refundRequest.routes'));
app.use('/api/v1/tickets', require('./modules/tickets/ticket.routes'));
app.use('/api/v1/buses', require('./modules/fleet/bus.routes'));
app.use('/api/v1/maintenance-facilities', require('./modules/fleet/maintenanceFacility.routes'));
app.use('/api/v1/uploads', require('./modules/uploads/upload.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/config', require('./modules/config/config.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/notification.routes'));
app.use('/api/v1/users', require('./modules/users/user.routes'));
app.use('/api/v1/audit', require('./modules/audit/audit.routes'));
app.use('/api/v1/stations', require('./modules/stations/station.routes'));
app.use('/api/v1/cities', require('./modules/stations/city.routes'));
app.use('/api/v1/tracking', require('./modules/tracking/tracking.routes'));
app.use('/api/v1/tenants', require('./modules/tenants/tenant.routes'));

app.use(errorHandler);

module.exports = app;
