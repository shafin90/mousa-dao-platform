const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function run() {
  console.log('Starting replica set...');
  const mongoServer = await MongoMemoryReplSet.create({
    replSet: { dbName: 'test-db', count: 1 }
  });
  const uri = mongoServer.getUri();
  console.log('Replica Set URI:', uri);

  console.log('Connecting mongoose...');
  await mongoose.connect(uri);
  console.log('Mongoose connected!');

  const admin = mongoose.connection.db.admin();
  const status = await admin.serverStatus();
  console.log('Replica Set Status:', status.repl ? 'Replica set active' : 'Not a replica set');

  // Let's test a transaction
  console.log('Starting transaction...');
  const session = await mongoose.startSession();
  session.startTransaction();
  const testSchema = new mongoose.Schema({ name: String });
  const TestModel = mongoose.model('TestTrans', testSchema);
  await TestModel.create([{ name: 'test' }], { session });
  await session.commitTransaction();
  session.endSession();
  console.log('Transaction succeeded!');

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Done!');
}

run().catch(console.error);
