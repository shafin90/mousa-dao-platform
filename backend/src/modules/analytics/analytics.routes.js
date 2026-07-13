const express = require('express');
const router = express.Router();
const analyticsController = require('./controllers/analytics.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/dashboard', analyticsController.getDashboardOverview);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/bookings', analyticsController.getBookingAnalytics);
router.get('/trips', analyticsController.getTripAnalytics);
router.get('/users', analyticsController.getUserAnalytics);
router.get('/booking-trends', analyticsController.getBookingTrends);
router.get('/monthly-revenue', analyticsController.getMonthlyRevenue);
router.get('/route-performance', analyticsController.getRoutePerformance);
router.get('/bus-utilization', analyticsController.getBusUtilization);
router.get('/cancellation-stats', analyticsController.getCancellationStats);
router.get('/peak-times', analyticsController.getPeakDepartureTimes);
router.get('/live-trips', analyticsController.getLiveTrips);
router.get('/recent-bookings', analyticsController.getRecentBookings);
router.get('/payment-summary', analyticsController.getPaymentSummary);
router.get('/alerts', analyticsController.getAlerts);
router.get('/today-stats', analyticsController.getTodayStats);
router.get('/customer-metrics', analyticsController.getCustomerAnalytics);
router.get('/payment-analytics', analyticsController.getPaymentAnalytics);

module.exports = router;
