const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  try {
    await db.collection('stations').dropIndex('companyId_1_name_1_cityId_1');
    console.log('Dropped unique index on stations');
  } catch (e) {
    console.log('Index not found or already dropped:', e.message);
  }
  await mongoose.disconnect();
}).catch(console.error);