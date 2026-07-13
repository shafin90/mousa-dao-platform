const express = require('express');
const router = express.Router();
const workOrderController = require('./controllers/workOrder.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createWorkOrderSchema, updateWorkOrderSchema, updateStatusSchema } = require('./validators/workOrder.validator');

router.use(authenticate);

router.get('/', workOrderController.getAllWorkOrders);
router.post('/', requireRole(['admin']), validate(createWorkOrderSchema), workOrderController.createWorkOrder);
router.get('/:id', workOrderController.getWorkOrderById);
router.patch('/:id', requireRole(['admin']), validate(updateWorkOrderSchema), workOrderController.updateWorkOrder);
router.patch('/:id/status', requireRole(['admin']), validate(updateStatusSchema), workOrderController.updateWorkOrderStatus);
router.delete('/:id', requireRole(['admin']), workOrderController.deleteWorkOrder);

module.exports = router;
