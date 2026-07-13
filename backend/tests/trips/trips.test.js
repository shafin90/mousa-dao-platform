const request = require('supertest');
const app = require('../../src/app');
const Route = require('../../src/modules/trips/models/Route');
const Trip = require('../../src/modules/trips/models/Trip');
const Bus = require('../../src/modules/fleet/models/Bus');
const mongoose = require('mongoose');
const { createTestUser } = require('../helpers/auth.helper');

describe('Trips & Routes Module Tests', () => {
  let adminToken;
  let customerToken;
  let fromStationId;
  let toStationId;

  beforeEach(async () => {
    const admin = await createTestUser({}, 'admin');
    adminToken = admin.token;

    const customer = await createTestUser({}, 'customer');
    customerToken = customer.token;

    fromStationId = new mongoose.Types.ObjectId().toString();
    toStationId = new mongoose.Types.ObjectId().toString();
  });

  describe('POST /api/v1/routes', () => {
    it('should allow admin to create a new route', async () => {
      const payload = {
        fromStation: fromStationId,
        toStation: toStationId,
        distanceKm: 150,
        estimatedTimeMinutes: 120,
        baseFare: 60
      };

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fromStation).toBe(fromStationId);
    });

    it('should deny route creation for customers', async () => {
      const payload = {
        fromStation: fromStationId,
        toStation: toStationId,
        distanceKm: 150,
        estimatedTimeMinutes: 120,
        baseFare: 60
      };

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/trips', () => {
    let route;
    let bus;

    beforeEach(async () => {
      route = await Route.create({
        fromStation: fromStationId,
        toStation: toStationId,
        distanceKm: 150,
        estimatedTimeMinutes: 120,
        baseFare: 60
      });

      bus = await Bus.create({
        busNumber: `BUS-${Math.random()}`,
        name: 'VIP Shuttle',
        capacity: 35,
        type: 'VIP',
        status: 'active'
      });
    });

    it('should allow admin/staff to schedule a new trip', async () => {
      const payload = {
        routeId: route._id.toString(),
        busId: bus._id.toString(),
        departureTime: '10:00 AM',
        arrivalTime: '12:00 PM',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        price: 60
      };

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.routeId).toBe(route._id.toString());
      expect(res.body.data.seatsTotal).toBe(35);
    });
  });

  describe('PATCH /api/v1/trips/:id/status', () => {
    let trip;

    beforeEach(async () => {
      const route = await Route.create({
        fromStation: fromStationId,
        toStation: toStationId,
        distanceKm: 150,
        estimatedTimeMinutes: 120,
        baseFare: 60
      });

      const bus = await Bus.create({
        busNumber: `BUS-${Math.random()}`,
        name: 'VIP Shuttle',
        capacity: 35,
        type: 'VIP',
        status: 'active'
      });

      trip = await Trip.create({
        routeId: route._id,
        busId: bus._id,
        departureTime: '10:00 AM',
        arrivalTime: '12:00 PM',
        date: new Date(),
        price: 60,
        seatsTotal: 35,
        status: 'scheduled'
      });
    });

    it('should allow admin to update trip status', async () => {
      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });
  });
});
