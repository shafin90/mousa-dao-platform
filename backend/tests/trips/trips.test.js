const request = require('supertest');
const app = require('../../src/app');
const Route = require('../../src/modules/trips/models/Route');
const Trip = require('../../src/modules/trips/models/Trip');
const Bus = require('../../src/modules/fleet/models/Bus');
const City = require('../../src/modules/stations/models/City');
const Station = require('../../src/modules/stations/models/Station');
const mongoose = require('mongoose');
const { createTestUser } = require('../helpers/auth.helper');

let fromStationId;
let toStationId;

const createTestStations = async (companyId) => {
  const city = await City.create({ companyId, name: 'Test City', country: 'Test Country' });
  const from = await Station.create({ companyId, name: 'From Station', cityId: city._id, location: { lat: 40.7128, lng: -74.006 }, status: 'active' });
  const to = await Station.create({ companyId, name: 'To Station', cityId: city._id, location: { lat: 34.0522, lng: -118.2437 }, status: 'active' });
  fromStationId = from._id;
  toStationId = to._id;
  return { fromStationId: from._id, toStationId: to._id };
};

describe('Trips & Routes Module Tests', () => {
  let adminToken;
  let customerToken;
  let companyId;

  beforeEach(async () => {
    companyId = new mongoose.Types.ObjectId();
    await createTestStations(companyId);

    const admin = await createTestUser({}, 'admin', companyId);
    adminToken = admin.token;

    const customer = await createTestUser({}, 'customer', companyId);
    customerToken = customer.token;
  });

  describe('POST /api/v1/routes', () => {
    it('should allow admin to create a new route', async () => {
      const payload = {
        fromCity: new mongoose.Types.ObjectId().toString(),
        toCity: new mongoose.Types.ObjectId().toString(),
        distanceKm: 150,
        estimatedTimeMinutes: 120,
      };

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should deny route creation for customers', async () => {
      const payload = {
        fromCity: new mongoose.Types.ObjectId().toString(),
        toCity: new mongoose.Types.ObjectId().toString(),
        distanceKm: 150,
        estimatedTimeMinutes: 120,
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
        companyId,
        fromCity: new mongoose.Types.ObjectId(),
        toCity: new mongoose.Types.ObjectId(),
        distanceKm: 150,
        estimatedTimeMinutes: 120,
      });

      bus = await Bus.create({
        busNumber: `BUS-${Math.random()}`,
        name: 'VIP Shuttle',
        capacity: 35,
        type: 'VIP',
        status: 'active',
        companyId,
      });
    });

    it('should allow admin/staff to schedule a new trip', async () => {
      const payload = {
        busId: bus._id.toString(),
        fromStation: fromStationId.toString(),
        toStation: toStationId.toString(),
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
      expect(res.body.data.seatsTotal).toBe(35);
    });
  });

  describe('PATCH /api/v1/trips/:id/status', () => {
    let trip;

    beforeEach(async () => {
      const route = await Route.create({
        companyId,
        fromCity: new mongoose.Types.ObjectId(),
        toCity: new mongoose.Types.ObjectId(),
        distanceKm: 150,
        estimatedTimeMinutes: 120,
      });

      const bus = await Bus.create({
        busNumber: `BUS-${Math.random()}`,
        name: 'VIP Shuttle',
        capacity: 35,
        type: 'VIP',
        status: 'active',
        companyId,
      });

      trip = await Trip.create({
        companyId,
        routeId: route._id,
        busId: bus._id,
        fromStation: new mongoose.Types.ObjectId(),
        toStation: new mongoose.Types.ObjectId(),
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
