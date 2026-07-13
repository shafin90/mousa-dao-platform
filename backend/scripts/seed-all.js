require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Models
const Tenant = require('../src/modules/tenants/models/Tenant');
const User = require('../src/modules/users/models/User');
const City = require('../src/modules/stations/models/City');
const Station = require('../src/modules/stations/models/Station');
const Route = require('../src/modules/trips/models/Route');
const Bus = require('../src/modules/fleet/models/Bus');
const Trip = require('../src/modules/trips/models/Trip');
const Booking = require('../src/modules/bookings/models/Booking');
const Payment = require('../src/modules/payments/models/Payment');
const RefundRequest = require('../src/modules/payments/models/RefundRequest');
const Ticket = require('../src/modules/tickets/models/Ticket');
const Config = require('../src/modules/config/config.model');
const Notification = require('../src/modules/notifications/models/Notification');
const Maintenance = require('../src/modules/fleet/models/Maintenance');

// ── Helpers ──
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const d = (days) => new Date(Date.now() + days * 86400000);

/** Generates seat labels (A1..A4, B1..) up to capacity. */
const seatLabels = (capacity) => {
  const rows = 'ABCDEFGHIJKLMN';
  const out = [];
  let i = 0;
  for (let r = 0; i < capacity; r++) {
    for (let c = 1; c <= 4 && i < capacity; c++) { out.push(`${rows[r]}${c}`); i++; }
  }
  return out;
};

const FIRST_NAMES = ['Jean', 'Marie', 'Paul', 'Aya', 'Koffi', 'Aminata', 'Yao', 'Fatou', 'Ibrahim', 'Awa', 'Serge', 'Nadia', 'Kader', 'Mariam', 'Bakary', 'Rokia'];
const LAST_NAMES = ['Konan', 'Kouassi', "N'Guessan", 'Traoré', 'Diarra', 'Koné', 'Ouattara', 'Bamba', 'Cissé', 'Touré', 'Yeo', 'Coulibaly'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Full reset (demo DB): wipe collections + drop legacy stale indexes ──
  const collectionsToReset = ['tenants', 'users', 'cities', 'stations', 'routes', 'buses', 'trips', 'bookings', 'payments', 'refundrequests', 'tickets', 'configs', 'notifications', 'maintenances', 'inventorylogs', 'buslocations'];
  for (const c of collectionsToReset) {
    try { await mongoose.connection.collection(c).deleteMany({}); } catch { /* collection may not exist */ }
  }
  // Legacy indexes from an older schema (tenantId_* instead of companyId_*) cause null-dup errors.
  for (const legacy of ['tenantId_1_email_1', 'tenantId_1_phone_1']) {
    try { await mongoose.connection.collection('users').dropIndex(legacy); console.log('Dropped legacy index', legacy); } catch { /* not present */ }
  }
  console.log('Cleared all collections');

  // ── Tenant + admin ──
  const hashedPw = await bcrypt.hash('admin123', 10);
  const tenant = await Tenant.create({ name: 'Demo Transport Co', email: 'admin@example.com', phone: '0100000000' });
  const companyId = tenant._id;
  const admin = await User.create({ companyId, email: 'admin@example.com', phone: '0100000000', password: hashedPw, role: 'admin', profile: { firstName: 'Admin', lastName: 'User' } });
  console.log('Created tenant + admin. Company:', companyId.toString());

  // ── USERS: staff + drivers + customers ──
  const staff = await User.create({ companyId, email: 'staff@example.com', phone: '0100000001', password: hashedPw, role: 'staff', profile: { firstName: 'Grace', lastName: 'Staff' } });

  const drivers = [];
  for (let i = 1; i <= 6; i++) {
    drivers.push(await User.create({
      companyId, email: `driver${i}@example.com`, phone: `01001000${10 + i}`, password: hashedPw, role: 'driver',
      profile: { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES), phone: `+225 07 0${rand(1000000, 9999999)}` },
    }));
  }

  const customers = [];
  for (let i = 1; i <= 12; i++) {
    customers.push(await User.create({
      companyId, email: `customer${i}@example.com`, phone: `01002000${String(i).padStart(2, '0')}`, password: hashedPw, role: 'customer',
      profile: { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) },
    }));
  }
  console.log(`Created 1 staff, ${drivers.length} drivers, ${customers.length} customers`);

  // ── CITIES ──
  const cityNames = ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San Pedro', 'Korhogo', 'Man', 'Daloa', 'Gagnoa'];
  const cities = await City.insertMany(cityNames.map((name) => ({ companyId, name })));
  const cityMap = {};
  cities.forEach((c) => { cityMap[c.name] = c._id; });
  console.log(`Created ${cities.length} cities`);

  // ── STATIONS ──
  const stationData = [
    { name: 'Adjamé Main Station', city: 'Abidjan', lat: 5.3476, lng: -4.0083, address: 'Carrefour Adjamé, Abidjan' },
    { name: 'Treichville Terminal', city: 'Abidjan', lat: 5.3130, lng: -3.9940, address: 'Rue 12, Treichville, Abidjan' },
    { name: 'Yamoussoukro Central', city: 'Yamoussoukro', lat: 6.8275, lng: -5.2893, address: "Boulevard Giscard d'Estaing" },
    { name: 'Bouaké Bus Station', city: 'Bouaké', lat: 7.6908, lng: -5.0310, address: 'Avenue de la Paix, Bouaké' },
    { name: 'San Pedro Port Terminal', city: 'San Pedro', lat: 4.7480, lng: -6.6443, address: 'Quai du Port, San Pedro' },
    { name: 'Korhogo Main Station', city: 'Korhogo', lat: 9.4566, lng: -5.6293, address: 'Route de Ferké, Korhogo' },
    { name: 'Man Central', city: 'Man', lat: 7.4125, lng: -7.5508, address: 'Avenue de la Liberté, Man' },
    { name: 'Daloa Gare', city: 'Daloa', lat: 6.8774, lng: -6.4502, address: 'Quartier Commerce, Daloa' },
    { name: 'Gagnoa Terminal', city: 'Gagnoa', lat: 6.1319, lng: -5.9506, address: 'Centre-ville, Gagnoa' },
  ];
  const stations = await Station.insertMany(stationData.map((s) => ({
    companyId, name: s.name, cityId: cityMap[s.city], address: s.address, location: { lat: s.lat, lng: s.lng },
  })));
  const stIdx = {};
  stations.forEach((s) => { stIdx[s.name] = s._id; });
  console.log(`Created ${stations.length} stations`);

  // ── ROUTES ──
  const routeData = [
    { from: 'Adjamé Main Station', to: 'Yamoussoukro Central', fare: 5000, dist: 240, time: 180 },
    { from: 'Adjamé Main Station', to: 'Bouaké Bus Station', fare: 7000, dist: 350, time: 240 },
    { from: 'Treichville Terminal', to: 'San Pedro Port Terminal', fare: 8000, dist: 400, time: 300 },
    { from: 'Yamoussoukro Central', to: 'Korhogo Main Station', fare: 6000, dist: 300, time: 210 },
    { from: 'Bouaké Bus Station', to: 'Man Central', fare: 5500, dist: 280, time: 200 },
    { from: 'Korhogo Main Station', to: 'Man Central', fare: 4500, dist: 220, time: 160 },
    { from: 'Adjamé Main Station', to: 'Daloa Gare', fare: 6500, dist: 320, time: 230 },
    { from: 'Daloa Gare', to: 'Gagnoa Terminal', fare: 3000, dist: 130, time: 110 },
  ];
  const routes = await Route.insertMany(routeData.map((r) => ({
    companyId, fromStation: stIdx[r.from], toStation: stIdx[r.to], baseFare: r.fare, distanceKm: r.dist, estimatedTimeMinutes: r.time,
  })));
  console.log(`Created ${routes.length} routes`);

  // ── BUSES (with full identity / compliance / purchase / photos) ──
  const BUS_PHOTOS = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
    'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=800&q=80',
  ];
  const busSeed = [
    { busNumber: 'BV-001', name: 'Mercedes Sprinter', capacity: 30, type: 'AC', driver: 0, status: 'active', make: 'Mercedes-Benz', model: 'Sprinter', year: 2021, color: 'White', plate: 'CI-1234-AB', vin: 'WDB9066331S123456', fuel: 'diesel', odo: 145000, regOff: 210, insOff: 18, fitOff: 120, insurer: 'NSIA Assurances', policy: 'POL-2024-0012', pDate: -900, pCost: 48000, depot: 'Adjamé Depot', features: { 'WiFi': true, 'AC': true, 'USB Charging': true } },
    { busNumber: 'BV-002', name: 'Volvo 9700', capacity: 45, type: 'VIP', driver: 1, status: 'active', make: 'Volvo', model: '9700', year: 2022, color: 'Blue', plate: 'CI-2233-CD', vin: 'YV3R8G1179A987654', fuel: 'diesel', odo: 98000, regOff: -12, insOff: 300, fitOff: 25, insurer: 'Allianz CI', policy: 'POL-2023-8890', pDate: -640, pCost: 92000, depot: 'Adjamé Depot', features: { 'WiFi': true, 'AC': true, 'USB Charging': true, 'Restroom': true, 'TV': true } },
    { busNumber: 'BV-003', name: 'Toyota Coaster', capacity: 25, type: 'AC', driver: 2, status: 'active', make: 'Toyota', model: 'Coaster', year: 2020, color: 'Silver', plate: 'CI-3344-EF', vin: 'JTGFB518001045321', fuel: 'diesel', odo: 176500, regOff: 90, insOff: 60, fitOff: -5, insurer: 'SUNU Assurances', policy: 'POL-2024-1120', pDate: -1200, pCost: 36000, depot: 'Treichville Depot', features: { 'AC': true, 'USB Charging': true } },
    { busNumber: 'BV-004', name: 'Isuzu Bighorn', capacity: 40, type: 'NON_AC', driver: 3, status: 'active', make: 'Isuzu', model: 'Bighorn', year: 2019, color: 'Green', plate: 'CI-4455-GH', vin: 'JACUA58N1K7654321', fuel: 'diesel', odo: 232000, regOff: 400, insOff: 200, fitOff: 200, insurer: 'NSIA Assurances', policy: 'POL-2022-5540', pDate: -1600, pCost: 30000, depot: 'Treichville Depot', features: { 'GPS': true } },
    { busNumber: 'BV-005', name: 'Scania Interlink', capacity: 50, type: 'VIP', driver: 4, status: 'maintenance', make: 'Scania', model: 'Interlink', year: 2023, color: 'Red', plate: 'CI-5566-IJ', vin: 'YS2K6X20005112233', fuel: 'diesel', odo: 41000, regOff: 320, insOff: 320, fitOff: 320, insurer: 'Allianz CI', policy: 'POL-2024-3301', pDate: -300, pCost: 110000, depot: 'Yamoussoukro Depot', features: { 'WiFi': true, 'AC': true, 'USB Charging': true, 'Restroom': true, 'TV': true, 'Power Outlets': true, 'Wheelchair Access': true } },
    { busNumber: 'BV-006', name: 'Hyundai Universe', capacity: 44, type: 'AC', driver: 5, status: 'active', make: 'Hyundai', model: 'Universe', year: 2021, color: 'White', plate: 'CI-6677-KL', vin: 'KMJHG17BPMC334455', fuel: 'diesel', odo: 121000, regOff: 15, insOff: 150, fitOff: 60, insurer: 'SUNU Assurances', policy: 'POL-2023-7712', pDate: -700, pCost: 70000, depot: 'Bouaké Depot', features: { 'WiFi': true, 'AC': true, 'USB Charging': true, 'Water': true } },
    { busNumber: 'BV-007', name: 'King Long XMQ', capacity: 55, type: 'NON_AC', status: 'inactive', make: 'King Long', model: 'XMQ6127', year: 2018, color: 'Yellow', plate: 'CI-7788-MN', vin: 'LA9F3EED4JASD1122', fuel: 'diesel', odo: 298000, regOff: -60, insOff: -30, fitOff: -40, insurer: 'NSIA Assurances', policy: 'POL-2021-2201', pDate: -2200, pCost: 55000, depot: 'Bouaké Depot', features: {} },
    { busNumber: 'BV-008', name: 'BYD K9 Electric', capacity: 36, type: 'VIP', status: 'active', make: 'BYD', model: 'K9', year: 2024, color: 'Teal', plate: 'CI-8899-OP', vin: 'LC0C14C43P0011223', fuel: 'electric', odo: 12000, regOff: 500, insOff: 500, fitOff: 500, insurer: 'Allianz CI', policy: 'POL-2025-0091', pDate: -120, pCost: 130000, depot: 'Adjamé Depot', features: { 'WiFi': true, 'AC': true, 'USB Charging': true, 'Power Outlets': true, 'TV': true } },
  ];
  const buses = await Bus.insertMany(busSeed.map((b) => ({
    companyId, busNumber: b.busNumber, name: b.name, capacity: b.capacity, type: b.type, status: b.status,
    assignedDriver: b.driver != null ? drivers[b.driver]._id : undefined,
    features: b.features,
    make: b.make, model: b.model, year: b.year, color: b.color, plateNumber: b.plate, vin: b.vin, fuelType: b.fuel, odometer: b.odo,
    registrationExpiry: d(b.regOff), insuranceProvider: b.insurer, insurancePolicyNumber: b.policy, insuranceExpiry: d(b.insOff), fitnessExpiry: d(b.fitOff),
    purchaseDate: d(b.pDate), purchaseCost: b.pCost, homeDepot: b.depot,
    photos: b.status === 'inactive' ? [] : BUS_PHOTOS.slice(0, rand(1, 3)),
  })));
  console.log(`Created ${buses.length} buses`);

  // ── MAINTENANCE logs ──
  const maintTypes = ['routine', 'repair', 'inspection', 'other'];
  const maintDesc = {
    routine: ['Oil & filter change', 'Tire rotation', 'Brake pad inspection', 'AC servicing', 'General service'],
    repair: ['Alternator replacement', 'Gearbox repair', 'Suspension fix', 'Radiator leak repair', 'Door mechanism repair'],
    inspection: ['Annual technical inspection', 'Roadworthiness check', 'Emissions test'],
    other: ['Interior deep clean', 'Repainting', 'Seat reupholstery'],
  };
  const maintDocs = [];
  for (const bus of buses) {
    const n = rand(1, 4);
    for (let i = 0; i < n; i++) {
      const type = pick(maintTypes);
      maintDocs.push({
        companyId, busId: bus._id, date: d(-rand(5, 300)), type,
        description: pick(maintDesc[type]), cost: rand(2, 60) * 50, odometer: (bus.odometer || 100000) - rand(1000, 20000),
        performedBy: pick(['CI AutoService', 'Garage Central', 'Mécano Express', 'In-house Workshop']),
        nextServiceDate: d(rand(30, 180)),
      });
    }
  }
  await Maintenance.insertMany(maintDocs);
  console.log(`Created ${maintDocs.length} maintenance logs`);

  // ── TRIPS ──
  const depTimes = ['06:00', '08:30', '11:00', '14:00', '17:00', '20:00'];
  const arrTimes = ['09:00', '11:30', '14:00', '17:00', '20:00', '23:00'];
  const offsets = [-7, -6, -5, -4, -3, -2, -1, 0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8];
  const activeBuses = buses.filter((b) => b.status === 'active');
  const tripDocs = offsets.map((off, i) => {
    const route = routes[i % routes.length];
    const bus = activeBuses[i % activeBuses.length];
    let status = off < 0 ? 'completed' : off === 0 ? 'active' : 'scheduled';
    if (off > 5 && i % 7 === 0) status = 'cancelled';
    return {
      companyId, routeId: route._id, busId: bus._id, date: d(off),
      departureTime: depTimes[i % depTimes.length], arrivalTime: arrTimes[i % arrTimes.length],
      price: route.baseFare + (bus.type === 'VIP' ? 2000 : 0),
      seatsTotal: bus.capacity, seatsBooked: 0, status,
    };
  });
  const trips = await Trip.insertMany(tripDocs);
  console.log(`Created ${trips.length} trips`);

  // ── BOOKINGS ──
  let codeNum = 1000;
  const bookings = [];
  const seatsBookedByTrip = {};
  for (const trip of trips) {
    if (trip.status === 'cancelled') continue;
    const labels = seatLabels(trip.seatsTotal);
    const used = new Set();
    const numBookings = rand(1, 4);
    for (let j = 0; j < numBookings; j++) {
      const seatCount = rand(1, 3);
      const seats = [];
      for (let s = 0; s < seatCount; s++) {
        const available = labels.filter((l) => !used.has(l));
        if (!available.length) break;
        const seat = pick(available);
        used.add(seat); seats.push(seat);
      }
      if (!seats.length) continue;
      const past = trip.status === 'completed';
      const status = trip.status === 'active' || past ? 'confirmed' : pick(['confirmed', 'pending']);
      const paymentStatus = status === 'confirmed' ? 'paid' : 'unpaid';
      const booking = await Booking.create({
        companyId, userId: pick(customers)._id, tripId: trip._id, seats, status, paymentStatus,
        totalAmount: seats.length * trip.price, bookingCode: `JET-${new Date().getFullYear()}-${codeNum++}`,
      });
      bookings.push({ doc: booking, trip });
      if (status !== 'cancelled') seatsBookedByTrip[trip._id] = (seatsBookedByTrip[trip._id] || 0) + seats.length;
    }
  }
  // sync seatsBooked on trips
  await Promise.all(Object.entries(seatsBookedByTrip).map(([tripId, cnt]) =>
    Trip.updateOne({ _id: tripId }, { seatsBooked: cnt })));
  console.log(`Created ${bookings.length} bookings`);

  // ── PAYMENTS ──
  const methods = ['wave', 'orange_money', 'mtn', 'moov', 'flutterwave'];
  const txn = () => `TXN-${uuidv4().slice(0, 12).toUpperCase()}`;
  const paymentDocs = bookings
    .filter((b) => b.doc.paymentStatus === 'paid')
    .map((b) => ({
      companyId, bookingId: b.doc._id, userId: b.doc.userId, method: pick(methods),
      tx_ref: `TMS-${uuidv4().slice(0, 8).toUpperCase()}`, transactionId: txn(), status: 'success', amount: b.doc.totalAmount,
    }));
  // a few pending / failed for unpaid bookings
  bookings.filter((b) => b.doc.paymentStatus === 'unpaid').slice(0, 4).forEach((b) => {
    paymentDocs.push({ companyId, bookingId: b.doc._id, userId: b.doc.userId, method: pick(methods), tx_ref: `TMS-${uuidv4().slice(0, 8).toUpperCase()}`, transactionId: txn(), status: pick(['pending', 'failed']), amount: b.doc.totalAmount });
  });
  await Payment.insertMany(paymentDocs);
  console.log(`Created ${paymentDocs.length} payments`);

  // ── TICKETS (confirmed bookings on active/completed trips; capped for speed) ──
  let tktNum = 1000;
  const ticketCandidates = bookings.filter((b) => b.doc.status === 'confirmed' && (b.trip.status === 'active' || b.trip.status === 'completed')).slice(0, 20);
  let ticketCount = 0;
  for (const b of ticketCandidates) {
    const payload = JSON.stringify({ bookingId: b.doc._id, userId: b.doc.userId, tripId: b.doc.tripId });
    const qrCode = await QRCode.toDataURL(payload);
    await Ticket.create({
      companyId, bookingId: b.doc._id, userId: b.doc.userId, tripId: b.doc.tripId,
      ticketNumber: `TKT-${tktNum++}`, qrCode, status: b.trip.status === 'completed' ? 'used' : 'valid',
    });
    ticketCount++;
  }
  console.log(`Created ${ticketCount} tickets (with real QR codes)`);

  // ── REFUND REQUESTS ──
  const refundCandidates = bookings.filter((b) => b.doc.paymentStatus === 'paid').slice(0, 4);
  const refundDocs = refundCandidates.map((b, i) => ({
    companyId, bookingId: b.doc._id, userId: b.doc.userId, amount: b.doc.totalAmount,
    reason: pick(['Customer changed mind', 'Trip was rescheduled', 'Duplicate booking', 'Medical emergency']),
    status: i === 0 ? 'approved' : i === 1 ? 'rejected' : 'pending',
  }));
  await RefundRequest.insertMany(refundDocs);
  console.log(`Created ${refundDocs.length} refund requests`);

  // ── CONFIG (upsert) ──
  await Config.findOneAndUpdate({ companyId }, {
    companyId, baseCurrency: 'XOF', timezone: 'Africa/Abidjan',
    platformCommissionPercentage: 10, driverCommissionPercentage: 80, taxPercentage: 5, maintenanceMode: false,
    featureFlags: { enableBooking: true, enablePayments: true, enableTicketing: true },
    pricingRules: { defaultBaseFareMultiplier: 1, vipMultiplier: 1.5 },
  }, { upsert: true, new: true });
  console.log('Upserted config');

  // ── NOTIFICATIONS ──
  await Notification.insertMany([
    { companyId, userId: admin._id, type: 'system', message: 'System seeded with demo data', key: 'systemInitialized', isRead: false },
    { companyId, userId: admin._id, type: 'booking', message: 'New booking confirmed to Yamoussoukro', key: 'bookingConfirmed', isRead: false },
    { companyId, userId: admin._id, type: 'payment', message: 'Payment received via Wave', key: 'paymentReceived', isRead: false },
    { companyId, userId: admin._id, type: 'trip', message: 'Trip BV-001 is now active', key: 'tripActive', isRead: true },
    { companyId, userId: admin._id, type: 'system', message: 'BV-007 registration & insurance have expired', key: 'complianceAlert', isRead: false },
    { companyId, userId: staff._id, type: 'booking', message: 'Pending booking requires confirmation', key: 'pendingBooking', isRead: false },
  ]);
  console.log('Created notifications');

  console.log('\n✅ Seed complete!');
  console.log('Admin login: admin@example.com / admin123');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
