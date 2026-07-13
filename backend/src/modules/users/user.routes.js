const express = require('express');
const router = express.Router();
const userController = require('./controllers/user.controller');
const validate = require('../../middlewares/validate.middleware');
const { createUserSchema, updateProfileSchema, updateRoleSchema, updateStatusSchema } = require('./validators/user.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/me', userController.getMyProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateMyProfile);

router.use(requireRole(['admin']));

router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateUserStatus);
router.patch('/:id/role', validate(updateRoleSchema), userController.updateUserRole);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
