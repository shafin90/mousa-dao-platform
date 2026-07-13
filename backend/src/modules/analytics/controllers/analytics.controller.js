const analyticsService = require('../analytics.service');
const { respond } = require('../../../utils/response');

const wrap = (fn) => async (req, res, next) => {
  try {
    const data = await fn(req.user.companyId, req.query);
    respond(res, 200, data);
  } catch (error) { next(error); }
};

const getDashboardOverview = wrap(analyticsService.getDashboardOverview);
const getRevenueAnalytics = wrap(analyticsService.getRevenueAnalytics);
const getBookingAnalytics = wrap(analyticsService.getBookingAnalytics);
const getTripAnalytics = wrap(analyticsService.getTripAnalytics);
const getUserAnalytics = wrap(analyticsService.getUserAnalytics);
const getBookingTrends = wrap(analyticsService.getBookingTrends);
const getMonthlyRevenue = wrap(analyticsService.getMonthlyRevenue);
const getRoutePerformance = wrap(analyticsService.getRoutePerformance);
const getBusUtilization = wrap(analyticsService.getBusUtilization);
const getCancellationStats = wrap(analyticsService.getCancellationStats);
const getPeakDepartureTimes = wrap(analyticsService.getPeakDepartureTimes);
const getLiveTrips = wrap(analyticsService.getLiveTrips);
const getRecentBookings = wrap(analyticsService.getRecentBookings);
const getPaymentSummary = wrap(analyticsService.getPaymentSummary);
const getAlerts = wrap(analyticsService.getAlerts);
const getTodayStats = wrap(analyticsService.getTodayStats);
const getCustomerAnalytics = wrap(analyticsService.getCustomerAnalytics);
const getPaymentAnalytics = wrap(analyticsService.getPaymentAnalytics);

module.exports = {
  getDashboardOverview, getRevenueAnalytics, getBookingAnalytics, getTripAnalytics, getUserAnalytics,
  getBookingTrends, getMonthlyRevenue, getRoutePerformance, getBusUtilization, getCancellationStats,
  getPeakDepartureTimes, getLiveTrips, getRecentBookings, getPaymentSummary, getAlerts, getTodayStats,
  getCustomerAnalytics, getPaymentAnalytics,
};
