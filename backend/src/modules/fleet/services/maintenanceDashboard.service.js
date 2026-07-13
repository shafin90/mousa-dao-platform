const Bus = require('../models/Bus');
const Maintenance = require('../models/Maintenance');
const maintenanceScheduleRepository = require('../repositories/maintenanceSchedule.repository');
const { computeScheduleStatus } = require('./maintenanceSchedule.service');

/**
 * Builds the Maintenance overview KPIs for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Object>}
 */
const getOverview = async (companyId) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalBuses, busesUnderMaintenance, vehiclesOutOfService, activeSchedules, costAgg] = await Promise.all([
    Bus.countDocuments({ companyId }),
    Bus.countDocuments({ companyId, status: 'maintenance' }),
    Bus.countDocuments({ companyId, status: 'inactive' }),
    maintenanceScheduleRepository.findAll(companyId, { isActive: true }),
    Maintenance.aggregate([
      { $match: { companyId, date: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]),
  ]);

  let upcomingMaintenance = 0;
  let overdueMaintenance = 0;
  activeSchedules.forEach((schedule) => {
    const { status } = computeScheduleStatus(schedule);
    if (status === 'overdue') overdueMaintenance += 1;
    else if (status === 'due' || status === 'upcoming') upcomingMaintenance += 1;
  });

  return {
    totalBuses,
    busesUnderMaintenance,
    upcomingMaintenance,
    overdueMaintenance,
    breakdownToday: 0,
    maintenanceCostThisMonth: costAgg[0]?.total || 0,
    vehiclesOutOfService,
  };
};

module.exports = { getOverview };
