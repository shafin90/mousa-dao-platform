const express = require('express');
const router = express.Router();
const cityController = require('./controllers/city.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createCitySchema, updateCitySchema } = require('./validators/city.validator');

router.use(authenticate);

router.get('/distance', cityController.getCityDistance);
router.get('/', cityController.getAllCities);
router.post('/', requireRole(['admin']), validate(createCitySchema), cityController.createCity);
router.get('/:id', cityController.getCityById);
router.post('/:id/geocode', requireRole(['admin']), cityController.geocodeCity);
router.patch('/:id', requireRole(['admin']), validate(updateCitySchema), cityController.updateCity);
router.delete('/:id', requireRole(['admin']), cityController.deleteCity);

module.exports = router;
