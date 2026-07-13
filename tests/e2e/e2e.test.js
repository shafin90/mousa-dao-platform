const request = require('supertest');
const app = require('../../backend/src/app');
const jwt = require('jsonwebtoken');
const { createTestTenant, createAdminUser, getAuthHeader } = require('../helpers/auth.helper');
const {
  createStation, createRoute, createBus, createTrip,
  createBooking, createPayment, createTicket, createCity,
} = require('../helpers/factory.helper');

describe('E2E Full Flow Test', () => {
  let tenant;
  let customerToken, customerUser;
  let staffToken, adminToken;
  let cairoStation, alexStation, route, bus, trip;
  let booking, payment, ticket;
  let superAdminToken;

  beforeAll(async () => {
    tenant = await createTestTenant({ name: 'E2E Transport Co' });

    const customer = await createTestUser(
      { firstName: 'Ahmed', lastName: 'E2E' },
      'customer',
      tenant
    );
    customerUser = customer.user;
    customerToken = customer.token;

    const staff = await createTestUser({}, 'staff', tenant);
    staffToken = staff.token;

    const admin = await createAdminUser(tenant);
    adminToken = admin.token;

    const superAdmin = await createAdminUser();
    superAdminToken = superAdmin.token;
  });

  describe('CUSTOMER JOURNEY', () => {
    it('C1: Register new customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'E2E Customer',
          email: `e2e-customer-${Date.now()}@example.com`,
          phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
          password: 'password123',
          role: 'customer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe('customer');
    });

    it('C2: Login as customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: customerUser.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.companyId).toBe(tenant._id.toString());
    });

    it('C3: Search available trips', async () => {
      cairoStation = await createStation(tenant._id, { name: 'Cairo Main', lat: 30.0444, lng: 31.2357 });
      alexStation = await createStation(tenant._id, { name: 'Alexandria', lat: 31.2001, lng: 29.9187 });

      route = await createRoute(tenant._id, {
        fromStation: cairoStation._id,
        toStation: alexStation._id,
        baseFare: 150,
        distanceKm: 220,
      });

      bus = await createBus(tenant._id, {
        busNumber: `BUS-E2E-${Date.now()}`,
        name: 'E2E Express',
        capacity: 40,
        type: 'AC',
      });

      trip = await createTrip(tenant._id, {
        routeId: route._id,
        busId: bus._id,
        departureTime: '08:00',
        arrivalTime: '11:30',
        price: 150,
        seatsTotal: 40,
        date: new Date(Date.now() + 7 * 86400000),
      });

      const res = await request(app)
        .get('/api/v1/trips')
        .set('Authorization', getAuthHeader(customerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('C4: Book a seat', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(customerToken))
        .send({ tripId: trip._id.toString(), seats: ['A1', 'A2'] });

      expect(res.status).toBe(202);
      expect(res.body.data.eventId).toBeDefined();

      booking = await createBooking(tenant._id, customerUser._id, trip._id, {
        seats: ['A1', 'A2'],
        totalAmount: 300,
        status: 'confirmed',
        paymentStatus: 'unpaid',
      });
    });

    it('C5: Make payment', async () => {
      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', getAuthHeader(customerToken))
        .send({ bookingId: booking._id.toString(), method: 'flutterwave' });

      expect(res.status).toBe(202);
      expect(res.body.data.tx_ref).toBeDefined();

      payment = await createPayment(tenant._id, customerUser._id, booking._id, {
        tx_ref: res.body.data.tx_ref,
        amount: 300,
        status: 'success',
        method: 'flutterwave',
      });
    });

    it('C6: Receive ticket', async () => {
      ticket = await createTicket(tenant._id, customerUser._id, booking._id, trip._id, {
        ticketNumber: `TKT-E2E-${Date.now()}`,
        qrCode: `qr-e2e-${Date.now()}-data`,
        status: 'valid',
      });

      await Booking.findByIdAndUpdate(booking._id, { paymentStatus: 'paid' });

      const res = await request(app)
        .get('/api/v1/tickets/my')
        .set('Authorization', getAuthHeader(customerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('valid');
    });

    it('C7: View ticket details', async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', getAuthHeader(customerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.ticketNumber).toBe(ticket.ticketNumber);
      expect(res.body.data.qrCode).toBeDefined();
    });
  });

  describe('BACKOFFICE JOURNEY', () => {
    it('B1: See all bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .query({ page: 1, limit: 10 })
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('B2: Verify ticket by staff', async () => {
      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', getAuthHeader(staffToken))
        .send({ ticketNumber: ticket.ticketNumber });

      expect(res.status).toBe(200);
      expect(res.body.data.ticketNumber).toBe(ticket.ticketNumber);
    });

    it('B3: Track bus location', async () => {
      const BusLocation = require('../../backend/src/modules/tracking/models/BusLocation');
      await BusLocation.create({
        companyId: tenant._id,
        busId: bus._id,
        tripId: trip._id,
        latitude: 30.5,
        longitude: 30.8,
        speed: 70,
        heading: 315,
      });

      const res = await request(app)
        .get(`/api/v1/tracking/live/${trip._id}`)
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.latitude).toBe(30.5);
      expect(res.body.data.longitude).toBe(30.8);
    });

    it('B4: Analytics accessible', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
    });
  });

  describe('SUPER ADMIN JOURNEY', () => {
    it('S1: See all tenants', async () => {
      const res = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('S2: Access revenue across all tenants', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/revenue')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
    });

    it('S3: Access audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('S4: Suspend and activate tenant', async () => {
      const targetTenant = await createTestTenant({ name: 'Temp Tenant' });

      const suspendRes = await request(app)
        .patch(`/api/v1/tenants/${targetTenant._id}/suspend`)
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('suspended');

      const activateRes = await request(app)
        .patch(`/api/v1/tenants/${targetTenant._id}/activate`)
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(activateRes.status).toBe(200);
      expect(activateRes.body.data.status).toBe('active');
    });
  });

  describe('VERIFY ENTIRE CHAIN', () => {
    it('should have consistent data across the full flow', async () => {
      const bookingRes = await request(app)
        .get(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', getAuthHeader(customerToken));
      expect(bookingRes.status).toBe(200);
      expect(bookingRes.body.data.paymentStatus).toBe('paid');
      expect(bookingRes.body.data.status).toBe('confirmed');

      const paymentRes = await request(app)
        .get(`/api/v1/payments/${payment._id}`)
        .set('Authorization', getAuthHeader(customerToken));
      expect(paymentRes.status).toBe(200);
      expect(paymentRes.body.data.status).toBe('success');

      const ticketRes = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', getAuthHeader(customerToken));
      expect(ticketRes.status).toBe(200);
      expect(ticketRes.body.data.status).toBe('valid');

      const tripRes = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set('Authorization', getAuthHeader(customerToken));
      expect(tripRes.status).toBe(200);
    });
  });
});
