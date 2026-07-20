const mongoose = require('mongoose');
require('dotenv').config({ path: '/home/ubuntu/Transportation-backend/.env' });

const City = require('/home/ubuntu/Transportation-backend/src/modules/stations/models/City');

const citiesData = [
  { name: 'Abidjan', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 5600000, location: { lat: 5.3476, lng: -4.0083 } },
  { name: 'Yamoussoukro', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 355000, location: { lat: 6.8275, lng: -5.2893 } },
  { name: 'Bouaké', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 575000, location: { lat: 7.6908, lng: -5.0310 } },
  { name: 'San Pedro', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 261000, location: { lat: 4.7480, lng: -6.6443 } },
  { name: 'Korhogo', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 286000, location: { lat: 9.4566, lng: -5.6293 } },
  { name: 'Man', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 172000, location: { lat: 7.4125, lng: -7.5508 } },
  { name: 'Daloa', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 245000, location: { lat: 6.8774, lng: -6.4502 } },
  { name: 'Gagnoa', country: "Côte d'Ivoire", timezone: 'Africa/Abidjan', approxPopulation: 215000, location: { lat: 6.1319, lng: -5.9506 } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tenants = await mongoose.connection.db.collection('tenants').find({}).toArray();
    if (tenants.length === 0) {
      console.error('No tenants found. Run seed-all.js first.');
      process.exit(1);
    }

    const companyId = tenants[0]._id;
    console.log(`Using tenant: ${tenants[0].name} (${companyId})`);

    await mongoose.connection.db.collection('cities').deleteMany({});

    const docs = citiesData.map((c) => ({ ...c, companyId }));
    const result = await City.insertMany(docs);
    console.log(`Inserted ${result.length} cities with timezone and population data`);
    result.forEach((c) =>
      console.log(`  - ${c.name}: ${c.country} | ${c.timezone} | ${c.approxPopulation?.toLocaleString()}`)
    );

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
