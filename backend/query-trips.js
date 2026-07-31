const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/backend', { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 5000 });
  console.log('Connected');
  const db = mongoose.connection.db;
  const trips = await db.collection('trips').aggregate([
    { $match: { date: { $gte: new Date('2026-07-28'), $lt: new Date('2026-07-29') } } },
    { $lookup: { from: 'buses', localField: 'busId', foreignField: '_id', as: 'bus' } },
    { $unwind: { path: '$bus', preserveNullAndEmptyArrays: true } },
    { $project: { date: 1, 'bus.name': 1, 'bus.busNumber': 1, departureTime: 1, arrivalTime: 1, price: 1 } }
  ]).toArray();
  console.log('Trips on July 28:', trips.length);
  for (const t of trips) console.log('Bus:', t.bus?.name, t.bus?.busNumber, '|', t.departureTime, '-', t.arrivalTime, '|', t.price);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
