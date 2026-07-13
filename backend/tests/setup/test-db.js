const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  // Configured as replica set to support transactions
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { dbName: 'test-db', count: 1 }
  });
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('Connected to Memory MongoDB Replica Set');
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = { connectDB, disconnectDB, clearDB };
