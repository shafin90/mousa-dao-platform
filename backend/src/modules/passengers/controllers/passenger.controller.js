const passengerRepository = require('../repositories/passenger.repository');
const { respond } = require('../../../utils/response');

const getMyPassengers = async (req, res, next) => {
  try {
    const passengers = await passengerRepository.findByUser(req.user._id, req.user.companyId);
    respond(res, 200, passengers);
  } catch (error) { next(error); }
};

const addPassenger = async (req, res, next) => {
  try {
    const passenger = await passengerRepository.create({ ...req.body, userId: req.user._id, companyId: req.user.companyId });
    respond(res, 201, passenger, 'Passenger added');
  } catch (error) { next(error); }
};

const updatePassenger = async (req, res, next) => {
  try {
    const passenger = await passengerRepository.updateOne(req.params.id, req.user._id, req.user.companyId, req.body);
    if (!passenger) return respond(res, 404, null, 'Passenger not found');
    respond(res, 200, passenger, 'Passenger updated');
  } catch (error) { next(error); }
};

const deletePassenger = async (req, res, next) => {
  try {
    const passenger = await passengerRepository.deleteOne(req.params.id, req.user._id, req.user.companyId);
    if (!passenger) return respond(res, 404, null, 'Passenger not found');
    respond(res, 200, null, 'Passenger deleted');
  } catch (error) { next(error); }
};

module.exports = { getMyPassengers, addPassenger, updatePassenger, deletePassenger };
