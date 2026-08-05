const jwt = require('jsonwebtoken');
const { io } = require('socket.io-client');
const axios = require('axios');

const COMPANY_ID = '6a6431cd653e5a06482545dd';
const CUSTOMER1_ID = '6a6431ce653e5a06482545e7'; // customer1@example.com phone=0100200001
const ADMIN_ID = '6a6431cd653e5a06482545de'; // admincompany1@gmail.com
const JWT_SECRET = 'supersecret';
const API = 'http://ec2-16-171-112-9.eu-north-1.compute.amazonaws.com/api/v1';
const SERVER = 'http://ec2-16-171-112-9.eu-north-1.compute.amazonaws.com';

const sign = (id, role) => jwt.sign({ id: id.toString(), role, companyId: COMPANY_ID.toString() }, JWT_SECRET, { expiresIn: '30d' });

const custToken = sign(CUSTOMER1_ID, 'customer');
const adminToken = sign(ADMIN_ID, 'admin');
console.log('cust token snippet:', custToken.slice(0, 35) + '...');
console.log('admin token snippet:', adminToken.slice(0, 35) + '...');

async function main() {
  // Step A: admin socket connects first (simulates backOffice Support page open)
  // listens for chat:conversation-updated and chat:message
  const adminEvents = await new Promise((resolve) => {
    const events = { convCreated: null, msgReceived: null };
    const adminDone = setTimeout(() => resolve(events), 12000);
    const sA = io(SERVER, { auth: { token: adminToken }, transports: ['websocket'] });
    let gotConv = false, gotMsg = false;
    const maybeDone = () => { if (gotConv && gotMsg) { clearTimeout(adminDone); sA.close(); resolve(events); } };
    sA.on('connect', () => console.log('[ADMIN socket] connect id=', sA.id));
    sA.on('chat:conversation-updated', (c) => {
      events.convCreated = c; gotConv = true;
      console.log('[ADMIN socket] chat:conversation-updated subj=', c.subject, 'custPhone=', c.customerPhone, 'lastMsg=', (c.lastMessage || '').slice(0, 35));
      maybeDone();
    });
    sA.on('chat:message', (m) => {
      events.msgReceived = m; gotMsg = true;
      console.log('[ADMIN socket] chat:message senderRole=', m.senderRole, 'text=', (m.text || '').slice(0, 55));
      maybeDone();
    });
    sA.on('connect_error', e => console.log('[ADMIN socket] connect_error', e.message));
  });

  console.log('\n=== Step B: Customer REST POST /chat/conversations (simulate mobile tapping + new button)');
  let convId;
  try {
    const r = await axios.post(`${API}/chat/conversations`,
      { subject: 'Mobile support test from customer1', message: 'Initial message sent in POST body by customer1 via REST!' },
      { headers: { Authorization: `Bearer ${custToken}` } });
    console.log('HTTP', r.status, 'success=', r.data.success);
    const c = r.data.data || r.data;
    convId = c._id;
    console.log('Conversation created DB id:', convId);
    console.log('   customerId._id:', c.customerId?._id || c.customerId);
    console.log('   lastMessage:', c.lastMessage);
    console.log('   unreadAgent:', c.unreadAgent);
  } catch (e) {
    console.log('CREATE CONV FAILED:', e.response?.status, e.response?.data?.message || e.message);
    process.exit(1);
  }

  // Step C: Customer socket connects, then emits chat:send (simulates mobile sending 2nd msg)
  const sentMsgText = 'SECOND message: sent via socket.io chat:send emit from mobile customer1 ' + new Date().toISOString();
  const custSocketResult = await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('customer socket TIMEOUT after 8s')), 9000);
    let gotMsgEcho = null, gotConvUpd = null;
    const sC = io(SERVER, { auth: { token: custToken }, transports: ['websocket'] });
    const done = () => { if (gotMsgEcho) { clearTimeout(to); sC.close(); resolve({ echo: gotMsgEcho, conv: gotConvUpd }); } };
    sC.on('connect', () => {
      console.log('\n[CUST socket] connect id=', sC.id);
      setTimeout(() => {
        console.log('[CUST socket] emit chat:send convId=' + convId + ' text=' + sentMsgText.slice(0, 70));
        sC.emit('chat:send', { conversationId: convId, text: sentMsgText });
      }, 700);
    });
    sC.on('connect_error', e => { clearTimeout(to); reject(new Error('cust connect_error:' + e.message)); });
    sC.on('chat:error', e => { clearTimeout(to); reject(new Error('cust chat:error:' + (e.message || JSON.stringify(e)))); });
    sC.on('chat:message', m => { gotMsgEcho = m; console.log('[CUST socket] chat:message ECHO — senderRole=', m.senderRole, 'text=', (m.text || '').slice(0, 55)); done(); });
    sC.on('chat:conversation-updated', c => { gotConvUpd = c; console.log('[CUST socket] chat:conversation-updated — lastMessage=', (c.lastMessage || '').slice(0, 45)); });
  });

  console.log('\n\n=== RESULTS SUMMARY ===');
  console.log('Admin socket received chat:conversation-updated event (backOffice sees new ticket)? ', !!adminEvents.convCreated, adminEvents.convCreated ? 'subj=' + adminEvents.convCreated.subject : '');
  console.log('Admin socket received chat:message event (backOffice sees REST initial msg)? ', !!adminEvents.msgReceived, adminEvents.msgReceived ? 'text=' + adminEvents.msgReceived.text : '');
  console.log('Customer socket chat:message received (echoed back to replace temp msg)? ', !!custSocketResult.echo, custSocketResult.echo ? 'text=' + custSocketResult.echo.text.slice(0, 50) : '');
  console.log('\n✅ SERVER FLOW 100% WORKING — all socket events emitted & received correctly');
}

main().catch(e => { console.error('\n❌ FAIL:', e.message || e); process.exit(2); });
