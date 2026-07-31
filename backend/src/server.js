require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const admin = require('./config/firebase');
const { loadConsumers } = require('./queue/consumer.loader');
const { initSocket } = require('./socket/index');
const { getRedisClient } = require('./redis/client');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const server = http.createServer(app);

const { publishToQueue, queues } = require('./queue/index');
const { v4: uuidv4 } = require('uuid');

const scheduleTripReminders = async () => {
  try {
    const Trip = require('./modules/trips/models/Trip');
    const Booking = require('./modules/bookings/models/Booking');

    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const trips = await Trip.find({
      date: { $gte: now, $lte: in24Hours },
      status: { $in: ['scheduled', 'active'] },
    });

    for (const trip of trips) {
      const [hours, minutes] = (trip.departureTime || '00:00').split(':').map(Number);
      const departure = new Date(trip.date);
      departure.setHours(hours, minutes, 0, 0);

      const hoursUntil = (departure - now) / (1000 * 60 * 60);
      if (hoursUntil < 2 || hoursUntil > 24) continue;

      const bookings = await Booking.find({ tripId: trip._id, companyId: trip.companyId, status: 'completed' });
      for (const booking of bookings) {
        const tripDate = trip.date ? new Date(trip.date).toISOString().split('T')[0] : 'unknown';
        await publishToQueue(queues.NOTIFICATION_QUEUE, {
          eventType: 'TRIP_REMINDER',
          type: 'trip',
          title: 'Rappel de trajet',
          message: 'Votre trajet approche. Pensez à vous présenter à l\'heure.',
          companyId: trip.companyId,
          bookingId: booking._id,
          userId: booking.userId,
          tripId: trip._id,
          eventId: `trip_reminder:${booking._id}:${tripDate}`,
        });
      }
    }
  } catch (error) {
    console.error('Trip reminder error:', error.message);
  }
};

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ Connected to MongoDB');

    console.log(`Firebase Admin initialized: ${admin.apps.length > 0 ? 'yes' : 'no'}`);

    await loadConsumers();

    // Redis is REQUIRED for production-like real-time performance.
    // On failure the app still starts and falls back to in-memory cache.
    try {
      await getRedisClient();
      console.log('✓ Connected to Redis at', REDIS_URL);
    } catch (redisError) {
      console.warn(
        '⚠ Redis unavailable — using in-memory fallback:',
        redisError.message,
      );
    }

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    setInterval(scheduleTripReminders, 60 * 60 * 1000);
    scheduleTripReminders();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
