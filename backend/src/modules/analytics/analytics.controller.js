const analyticsService = require('./analytics.service');

const getDashboardOverview = async (req, res) => {
  try {
    const data = await analyticsService.getDashboardOverview(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getRevenueAnalytics(req.user.companyId, startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getBookingAnalytics(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTripAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getTripAnalytics(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getUserAnalytics(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingTrends = async (req, res) => {
  try {
    const data = await analyticsService.getBookingTrends(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const data = await analyticsService.getMonthlyRevenue(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRoutePerformance = async (req, res) => {
  try {
    const data = await analyticsService.getRoutePerformance(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBusUtilization = async (req, res) => {
  try {
    const data = await analyticsService.getBusUtilization(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getCancellationStats = async (req, res) => {
  try {
    const data = await analyticsService.getCancellationStats(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPeakDepartureTimes = async (req, res) => {
  try {
    const data = await analyticsService.getPeakDepartureTimes(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getLiveTrips = async (req, res) => {
  try {
    const data = await analyticsService.getLiveTrips(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRecentBookings = async (req, res) => {
  try {
    const data = await analyticsService.getRecentBookings(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPaymentSummary = async (req, res) => {
  try {
    const data = await analyticsService.getPaymentSummary(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const data = await analyticsService.getAlerts(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTodayStats = async (req, res) => {
  try {
    const data = await analyticsService.getTodayStats(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getCustomerAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getCustomerAnalytics(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPaymentAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getPaymentAnalytics(req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardOverview, getRevenueAnalytics, getBookingAnalytics, getTripAnalytics, getUserAnalytics, getBookingTrends, getMonthlyRevenue, getRoutePerformance, getBusUtilization, getCancellationStats, getPeakDepartureTimes, getLiveTrips, getRecentBookings, getPaymentSummary, getAlerts, getTodayStats, getCustomerAnalytics, getPaymentAnalytics };
