const tripService = require('./trip.service');

const createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'Trip created', data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllTrips = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips(req.user.companyId, req.query);
    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('getAllTrips error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.companyId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTripStatus = async (req, res) => {
  try {
    const trip = await tripService.updateTripStatus(req.params.id, req.user.companyId, req.body.status);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Status updated', data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const trip = await tripService.deleteTrip(req.params.id, req.user.companyId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTrip = async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.companyId, req.body);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Trip updated', data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, updateTripStatus, deleteTrip };
