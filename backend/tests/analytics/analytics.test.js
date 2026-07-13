const request = require('supertest');
const app = require('../../src/app');
const Booking = require('../../src/modules/bookings/models/Booking');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip, createTestBooking } = require('../helpers/booking.helper');

describe('Analytics Module Tests', () => {
  let adminToken;
  let trip;
  let user;

  beforeEach(async () => {
    const admin = await createTestUser({}, 'admin');
    adminToken = admin.token;
    user = admin.user;

    const data = await setupTestRouteAndTrip();
    trip = data.trip;
    
    // Create some bookings to aggregate
    const booking1 = await createTestBooking(user._id, trip._id, ['1A']);
    booking1.status = 'confirmed';
    booking1.paymentStatus = 'paid';
    await booking1.save();
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return dashboard overview for admins', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBookings).toBeDefined();
      expect(res.body.data.totalRevenue).toBeDefined();
    });

    it('should return 403 for non-admins', async () => {
      const customer = await createTestUser({}, 'customer');
      
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/analytics/revenue', () => {
    it('should calculate revenue statistics correctly', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.revenueByMethod).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/bookings', () => {
    it('should return booking analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingsByStatus).toBeDefined();
    });
  });
});
