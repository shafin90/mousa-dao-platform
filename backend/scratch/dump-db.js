const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://mousa:mousa@ac-7vpsxqc-shard-00-00.yhuz2xd.mongodb.net:27017,ac-7vpsxqc-shard-00-01.yhuz2xd.mongodb.net:27017,ac-7vpsxqc-shard-00-02.yhuz2xd.mongodb.net:27017/backend?ssl=true&replicaSet=atlas-129nup-shard-0&authSource=admin&appName=Cluster0';
mongoose.connect(MONGODB_URI).then(async () => {
  const User = mongoose.model('U', new mongoose.Schema({}), 'users');
  const all = await User.find({}).select('_id email phone role companyId').lean();
  console.log('All users in DB (total=' + all.length + '):');
  all.forEach(u => console.log('  _id=' + u._id + ' role=' + u.role + ' companyId=' + u.companyId + ' email=' + (u.email || '?') + ' phone=' + (u.phone || '')));

  const Conv = mongoose.model('C', new mongoose.Schema({}), 'conversations');
  const convs = await Conv.find({}).select('_id companyId customerId subject status lastMessage').lean();
  console.log('\nConversations (total=' + convs.length + '):');
  convs.forEach(c => console.log('  _id=' + c._id + ' companyId=' + c.companyId + ' customerId=' + c.customerId + ' status=' + c.status + ' subj=' + c.subject + ' last=' + (c.lastMessage || '').slice(0, 40)));

  const Tenant = mongoose.model('T', new mongoose.Schema({}), 'tenants');
  const tenants = await Tenant.find({}).lean();
  console.log('\nTenants (total=' + tenants.length + '):');
  tenants.forEach(t => console.log('  _id=' + t._id + ' name=' + t.name + ' email=' + (t.email || '?')));

  const Chats = mongoose.model('M', new mongoose.Schema({}), 'chatmessages');
  console.log('\nChatMessages count: ' + (await Chats.countDocuments({})));

  await mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
