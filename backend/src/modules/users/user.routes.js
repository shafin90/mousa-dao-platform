const express = require('express');
const router = express.Router();
const userController = require('./controllers/user.controller');
const validate = require('../../middlewares/validate.middleware');
const { createUserSchema, updateProfileSchema, updateRoleSchema, updateStatusSchema } = require('./validators/user.validator');
const { authenticate, requireRole, logManagerAction } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/me', userController.getMyProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateMyProfile);

router.get('/', requireRole(['admin', 'manager']), userController.getAllUsers);
router.get('/:id', requireRole(['admin', 'manager']), userController.getUserById);
router.post('/', requireRole(['admin']), validate(createUserSchema), userController.createUser);
router.patch('/:id/status', requireRole(['admin']), validate(updateStatusSchema), userController.updateUserStatus);
router.patch('/:id/role', requireRole(['admin']), validate(updateRoleSchema), userController.updateUserRole);
router.patch('/:id', requireRole(['admin', 'manager']), logManagerAction('UPDATE_USER', 'USERS'), userController.updateUser);
router.delete('/:id', requireRole(['admin']), userController.deleteUser);

module.exports = router;
