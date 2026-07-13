const express = require('express');
const router = express.Router();
const tenantController = require('./controllers/tenant.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.post('/', tenantController.createTenant);

router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/', tenantController.getAllTenants);
router.get('/:id', tenantController.getTenantById);
router.patch('/:id', tenantController.updateTenant);
router.patch('/:id/suspend', tenantController.suspendTenant);
router.patch('/:id/activate', tenantController.activateTenant);

module.exports = router;
