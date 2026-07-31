const request = require('supertest');
const app = require('../../src/app');
const Audit = require('../../src/modules/audit/audit.model');
const auditService = require('../../src/modules/audit/audit.service');
const { createTestUser } = require('../helpers/auth.helper');
const mongoose = require('mongoose');

describe('Audit Log Module Tests', () => {
  let adminToken;
  let user;
  let companyId;

  beforeEach(async () => {
    companyId = new mongoose.Types.ObjectId();
    const admin = await createTestUser({}, 'admin', companyId);
    adminToken = admin.token;
    user = admin.user;
  });

  describe('Audit Service logAction', () => {
    it('should successfully create an audit log entry', async () => {
      const log = await auditService.logAction({
        companyId,
        userId: user._id,
        action: 'TEST_ACTION',
        module: 'TEST_MODULE',
        description: 'Test Description',
        status: 'success'
      });

      expect(log._id).toBeDefined();
      expect(log.action).toBe('TEST_ACTION');
      expect(log.module).toBe('TEST_MODULE');

      const found = await Audit.findById(log._id);
      expect(found).toBeDefined();
      expect(found.action).toBe('TEST_ACTION');
    });
  });

  describe('GET /api/v1/audit', () => {
    it('should allow admin to retrieve audit logs', async () => {
      await auditService.logAction({
        companyId,
        userId: user._id,
        action: 'FETCH_AUDIT_TEST',
        module: 'AUDIT',
        description: 'Admin retrieved logs',
        status: 'success'
      });

      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny non-admin from retrieving audit logs', async () => {
      const customer = await createTestUser({}, 'customer', companyId);

      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(403);
    });
  });
});
