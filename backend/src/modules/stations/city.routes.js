const express = require('express');
const router = express.Router();
const cityController = require('./controllers/city.controller');
const { authenticate, requireRole, logManagerAction } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createCitySchema, updateCitySchema } = require('./validators/city.validator');

router.use(authenticate);

router.get('/distance', requireRole(['admin', 'manager']), cityController.getCityDistance);
router.get('/', requireRole(['admin', 'manager', 'customer']), cityController.getAllCities);
router.post('/', requireRole(['admin']), validate(createCitySchema), cityController.createCity);
router.get('/:id', requireRole(['admin', 'manager', 'customer']), cityController.getCityById);
router.post('/:id/geocode', requireRole(['admin']), cityController.geocodeCity);
router.patch('/:id', requireRole(['admin', 'manager']), logManagerAction('UPDATE_CITY', 'CITIES'), validate(updateCitySchema), cityController.updateCity);
router.delete('/:id', requireRole(['admin']), cityController.deleteCity);

module.exports = router;
