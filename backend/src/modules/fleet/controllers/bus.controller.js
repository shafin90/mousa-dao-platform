const busService = require('../services/bus.service');
const { getSeatLayout } = require('../services/seat.service');
const bookingRepository = require('../../bookings/repositories/booking.repository');
const tripRepository = require('../../trips/repositories/trip.repository');
const { respond, respondPaginated } = require('../../../utils/response');
const { notifyAllCustomers } = require('../../notifications/services/notification.service');

const createBus = async (req, res, next) => {
  try {
    const bus = await busService.createBus(req.user.companyId, req.body);
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'fleet_update',
      title: 'Nouveau bus',
      message: `Un nouveau bus "${bus.name}" a été ajouté à la flotte`,
      data: { busId: bus._id },
    }).catch(() => {});
    respond(res, 201, bus, 'Bus created');
  } catch (error) { next(error); }
};

const getAllBuses = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await busService.getAllBuses(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.buses, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) { next(error); }
};

const getBusById = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.params.id, req.user.companyId);
    respond(res, 200, bus);
  } catch (error) { next(error); }
};

const updateBus = async (req, res, next) => {
  try {
    const bus = await busService.updateBus(req.params.id, req.user.companyId, req.body);
    if (!bus) return respond(res, 404, null, 'Bus not found');
    respond(res, 200, bus, 'Bus updated');
  } catch (error) { next(error); }
};

const updateBusStatus = async (req, res, next) => {
  try {
    const bus = await busService.updateBusStatus(req.params.id, req.user.companyId, req.body.status);
    if (!bus) return respond(res, 404, null, 'Bus not found');
    respond(res, 200, bus, 'Bus status updated');
  } catch (error) { next(error); }
};

const assignDriver = async (req, res, next) => {
  try {
    const bus = await busService.assignDriver(req.params.id, req.user.companyId, req.body.driverId);
    if (!bus) return respond(res, 404, null, 'Bus not found');
    respond(res, 200, bus, 'Driver assigned');
  } catch (error) { next(error); }
};

const addMaintenanceLog = async (req, res, next) => {
  try {
    const log = await busService.addMaintenanceLog(req.params.id, req.user.companyId, req.body);
    respond(res, 201, log, 'Maintenance log added');
  } catch (error) { next(error); }
};

const getMaintenanceLogs = async (req, res, next) => {
  try {
    const logs = await busService.getMaintenanceLogs(req.params.id, req.user.companyId);
    respond(res, 200, logs);
  } catch (error) { next(error); }
};

const deleteBus = async (req, res, next) => {
  try {
    const bus = await busService.deleteBus(req.params.id, req.user.companyId);
    if (!bus) return respond(res, 404, null, 'Bus not found');
    respond(res, 200, null, 'Bus deleted');
  } catch (error) { next(error); }
};

const getBusSeatLayout = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.params.id, req.user.companyId);
    if (!bus) return respond(res, 404, null, 'Bus not found');

    const trips = await tripRepository.findMany({ busId: bus._id, companyId: req.user.companyId }, { page: 1, limit: 1000 });
    const tripIds = trips.items.map((t) => t._id);

    let bookedSeats = [];
    if (tripIds.length) {
      const bookings = await bookingRepository.findMany({ tripId: { $in: tripIds }, companyId: req.user.companyId, status: { $ne: 'cancelled' } }, 1, 10000);
      for (const booking of bookings.bookings) {
        bookedSeats = bookedSeats.concat(booking.seats);
      }
    }

    const layout = getSeatLayout(bus, bookedSeats);
    respond(res, 200, { bus: { _id: bus._id, busNumber: bus.name, capacity: bus.capacity }, layout });
  } catch (error) { next(error); }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, updateBusStatus, assignDriver, addMaintenanceLog, getMaintenanceLogs, deleteBus, getBusSeatLayout };
