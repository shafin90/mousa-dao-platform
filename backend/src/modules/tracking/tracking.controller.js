const BusLocation = require('./models/BusLocation');
const Trip = require('../trips/models/Trip');
const { getBusLocationCache } = require('../../redis/client');

const getLiveTripLocation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findOne({ _id: tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const location = await BusLocation.findOne({ tripId, companyId: req.user.companyId });
    if (!location) return res.status(404).json({ success: false, message: 'No location data for this trip' });

    res.json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;

    const cached = await getBusLocationCache(req.user.companyId, busId);
    if (cached) {
      return res.json({ success: true, data: cached, source: 'cache' });
    }

    const location = await BusLocation.findOne({ busId, companyId: req.user.companyId });
    if (!location) return res.status(404).json({ success: false, message: 'No location data for this bus' });

    res.json({ success: true, data: location, source: 'db' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getActiveBuses = async (req, res) => {
  try {
    const activeTrips = await Trip.find({
      companyId: req.user.companyId,
      status: 'active',
    }).select('_id busId');

    const tripIds = activeTrips.map(t => t._id);
    const busIds = activeTrips.map(t => t.busId);

    const locations = await BusLocation.find({
      companyId: req.user.companyId,
      tripId: { $in: tripIds },
    }).populate('busId', 'busNumber name type');

    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getLiveTripLocation, getBusLocation, getActiveBuses };
