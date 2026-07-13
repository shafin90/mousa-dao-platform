const Booking = require('../bookings/models/Booking');
const Trip = require('../trips/models/Trip');
const Payment = require('../payments/models/Payment');
const User = require('../users/models/User');
const Bus = require('../fleet/models/Bus');
const Route = require('../trips/models/Route');

const getDashboardOverview = async (companyId) => {
  const [revenue, bookings, trips, users, buses] = await Promise.all([
    Payment.aggregate([{ $match: { status: 'success', companyId: companyId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Booking.countDocuments({ companyId }),
    Trip.countDocuments({ companyId }),
    User.countDocuments({ companyId }),
    Bus.countDocuments({ companyId, status: 'active' })
  ]);

  const totalSeats = await Trip.aggregate([{ $match: { companyId: companyId } }, { $group: { _id: null, total: { $sum: '$seatsTotal' } } }]);
  const bookedSeats = await Trip.aggregate([{ $match: { companyId: companyId } }, { $group: { _id: null, total: { $sum: '$seatsBooked' } } }]);

  return {
    totalRevenue: revenue[0]?.total || 0,
    totalBookings: bookings,
    totalTrips: trips,
    totalUsers: users,
    activeBuses: buses,
    occupancyRate: totalSeats[0]?.total ? ((bookedSeats[0]?.total || 0) / totalSeats[0].total) * 100 : 0
  };
};

const getRevenueAnalytics = async (companyId, query = {}) => {
  const { startDate, endDate } = query || {};
  const match = { status: 'success', companyId: companyId };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const dailyRevenue = await Payment.aggregate([
    { $match: match },
    { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
        dailyRevenue: { $sum: "$amount" } 
      } 
    },
    { $sort: { _id: 1 } }
  ]);

  const revenueByMethod = await Payment.aggregate([
    { $match: match },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const totalRevenue = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return {
    dailyRevenue,
    revenueByMethod,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

const getBookingAnalytics = async (companyId) => {
  const rawStats = await Booking.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const bookingsByStatus = rawStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
  
  const topRoutes = await Booking.aggregate([
    { $match: { companyId: companyId } },
    { $lookup: { from: 'trips', localField: 'tripId', foreignField: '_id', as: 'trip' } },
    { $unwind: "$trip" },
    { $match: { 'trip.companyId': companyId } },
    { $group: { _id: "$trip.routeId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
    { $match: { 'route.companyId': companyId } },
  ]);

  return { bookingsByStatus, topRoutes };
};

const getTripAnalytics = async (companyId) => {
  return await Trip.aggregate([
    { $match: { companyId: companyId } },
    { $project: { 
        occupancyRate: { $multiply: [{ $divide: ["$seatsBooked", "$seatsTotal"] }, 100] },
        routeId: 1
      }
    }
  ]);
};

const getUserAnalytics = async (companyId) => {
  return await User.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
};

const getBookingTrends = async (companyId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await Booking.aggregate([
    { $match: { companyId: companyId, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const getMonthlyRevenue = async (companyId) => {
  return await Payment.aggregate([
    { $match: { status: 'success', companyId: companyId } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        transactions: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const getRoutePerformance = async (companyId) => {
  const data = await Booking.aggregate([
    { $match: { companyId: companyId } },
    { $lookup: { from: 'trips', localField: 'tripId', foreignField: '_id', as: 'trip' } },
    { $unwind: "$trip" },
    { $match: { 'trip.companyId': companyId } },
    { $group: { _id: "$trip.routeId", bookings: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" } } },
    { $sort: { bookings: -1 } },
    { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
    { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
    { $match: { 'route.companyId': companyId } },
    { $lookup: { from: 'stations', localField: 'route.fromStation', foreignField: '_id', as: 'fromStation' } },
    { $lookup: { from: 'stations', localField: 'route.toStation', foreignField: '_id', as: 'toStation' } },
    { $addFields: {
        fromStationName: { $arrayElemAt: ["$fromStation.name", 0] },
        toStationName: { $arrayElemAt: ["$toStation.name", 0] },
      }
    },
    { $project: { route: 0, fromStation: 0, toStation: 0 } },
  ]);

  return data;
};

const getBusUtilization = async (companyId) => {
  return await Trip.aggregate([
    { $match: { companyId: companyId } },
    { $group: {
        _id: "$busId",
        totalTrips: { $sum: 1 },
        avgOccupancy: { $avg: { $multiply: [{ $divide: ["$seatsBooked", "$seatsTotal"] }, 100] } },
        totalSeats: { $sum: "$seatsTotal" },
        totalBooked: { $sum: "$seatsBooked" },
      }
    },
    { $lookup: { from: 'buses', localField: '_id', foreignField: '_id', as: 'bus' } },
    { $unwind: { path: "$bus", preserveNullAndEmptyArrays: true } },
    { $match: { 'bus.companyId': companyId } },
    { $project: {
        busNumber: { $ifNull: ["$bus.busNumber", "Unknown"] },
        totalTrips: 1,
        avgOccupancy: { $round: ["$avgOccupancy", 1] },
        totalSeats: 1,
        totalBooked: 1,
      }
    },
    { $sort: { avgOccupancy: -1 } }
  ]);
};

const getCancellationStats = async (companyId) => {
  const total = await Booking.countDocuments({ companyId });
  const cancelled = await Booking.countDocuments({ companyId, status: 'cancelled' });
  
  const byRoute = await Booking.aggregate([
    { $match: { companyId: companyId } },
    { $lookup: { from: 'trips', localField: 'tripId', foreignField: '_id', as: 'trip' } },
    { $unwind: "$trip" },
    { $match: { 'trip.companyId': companyId } },
    { $group: {
        _id: { routeId: "$trip.routeId", status: "$status" },
        count: { $sum: 1 },
      }
    },
    { $group: {
        _id: "$_id.routeId",
        total: { $sum: "$count" },
        cancelled: { $sum: { $cond: [{ $eq: ["$_id.status", "cancelled"] }, "$count", 0] } },
      }
    },
    { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
    { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
    { $match: { 'route.companyId': companyId } },
    { $lookup: { from: 'stations', localField: 'route.fromStation', foreignField: '_id', as: 'fromSt' } },
    { $lookup: { from: 'stations', localField: 'route.toStation', foreignField: '_id', as: 'toSt' } },
    { $project: {
        total: 1,
        cancelled: 1,
        rate: { $round: [{ $multiply: [{ $divide: ["$cancelled", "$total"] }, 100] }, 1] },
        fromStationName: { $arrayElemAt: ["$fromSt.name", 0] },
        toStationName: { $arrayElemAt: ["$toSt.name", 0] },
      }
    },
    { $sort: { rate: -1 } }
  ]);

  return {
    totalBookings: total,
    cancelledBookings: cancelled,
    cancellationRate: total ? parseFloat(((cancelled / total) * 100).toFixed(1)) : 0,
    byRoute,
  };
};

const getLiveTrips = async (companyId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const trips = await Trip.find({
    companyId,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['scheduled', 'boarding', 'active'] }
  })
    .populate({ path: 'routeId', populate: { path: 'fromStation toStation', select: 'name' } })
    .populate({ path: 'busId', select: 'busNumber name capacity' })
    .sort({ departureTime: 1 })
    .limit(20);

  return trips.map(t => ({
    _id: t._id,
    route: t.routeId ? `${t.routeId.fromStation?.name || ''} → ${t.routeId.toStation?.name || ''}` : 'N/A',
    bus: t.busId ? `${t.busId.busNumber} - ${t.busId.name}` : 'N/A',
    departureTime: t.departureTime,
    date: t.date,
    seatsTotal: t.seatsTotal,
    seatsBooked: t.seatsBooked,
    status: t.status,
    occupancyRate: t.seatsTotal ? Math.round((t.seatsBooked / t.seatsTotal) * 100) : 0,
  }));
};

const getRecentBookings = async (companyId) => {
  const bookings = await Booking.find({ companyId })
    .populate({ path: 'userId', select: 'profile email' })
    .populate({
      path: 'tripId',
      select: 'routeId departureTime date price',
      populate: { path: 'routeId', select: 'fromStation toStation', populate: { path: 'fromStation toStation', select: 'name' } }
    })
    .sort({ createdAt: -1 })
    .limit(10);

  return bookings.map(b => ({
    _id: b._id,
    customer: b.userId ? `${b.userId.profile?.firstName || ''} ${b.userId.profile?.lastName || ''}`.trim() || b.userId.email : 'N/A',
    route: b.tripId?.routeId ? `${b.tripId.routeId.fromStation?.name || ''} → ${b.tripId.routeId.toStation?.name || ''}` : 'N/A',
    seats: b.seats?.length || 0,
    totalAmount: b.totalAmount,
    paymentStatus: b.paymentStatus,
    status: b.status,
    createdAt: b.createdAt,
  }));
};

const getPaymentSummary = async (companyId) => {
  const [success, failed, pending] = await Promise.all([
    Payment.countDocuments({ companyId, status: 'success' }),
    Payment.countDocuments({ companyId, status: 'failed' }),
    Payment.countDocuments({ companyId, status: 'pending' }),
  ]);
  const total = success + failed + pending;

  return {
    successful: success,
    failed,
    pending,
    total,
    successRate: total ? Math.round((success / total) * 100) : 0,
  };
};

const getAlerts = async (companyId) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [delayedTrips, maintenanceBuses, failedPayments, cancelledTrips] = await Promise.all([
    Trip.countDocuments({ companyId, date: { $gte: today, $lt: tomorrow }, status: 'scheduled', departureTime: { $lt: now.toTimeString().slice(0, 5) } }),
    Bus.countDocuments({ companyId, status: 'maintenance' }),
    Payment.countDocuments({ companyId, status: 'failed', createdAt: { $gte: today } }),
    Trip.countDocuments({ companyId, date: { $gte: today, $lt: tomorrow }, status: 'cancelled' }),
  ]);

  const alerts = [];
  if (delayedTrips > 0) alerts.push({ type: 'warning', key: 'delayedTrips', message: `${delayedTrips} trip(s) are past scheduled departure time`, count: delayedTrips });
  if (maintenanceBuses > 0) alerts.push({ type: 'warning', key: 'maintenanceBuses', message: `${maintenanceBuses} bus(es) under maintenance`, count: maintenanceBuses });
  if (failedPayments > 0) alerts.push({ type: 'error', key: 'failedPayments', message: `${failedPayments} payment(s) failed today`, count: failedPayments });
  if (cancelledTrips > 0) alerts.push({ type: 'error', key: 'cancelledTrips', message: `${cancelledTrips} trip(s) cancelled today`, count: cancelledTrips });
  if (alerts.length === 0) alerts.push({ type: 'success', key: 'allOperational', message: 'All systems operational', count: 0 });

  return alerts;
};

const getTodayStats = async (companyId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, todayRevenue, activeTrips, todayPassengers] = await Promise.all([
    Booking.countDocuments({ companyId, createdAt: { $gte: today, $lt: tomorrow } }),
    Payment.aggregate([
      { $match: { companyId: companyId, status: 'success', createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Trip.countDocuments({ companyId, date: { $gte: today, $lt: tomorrow }, status: { $in: ['scheduled', 'boarding', 'active'] } }),
    Booking.aggregate([
      { $match: { companyId: companyId, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: { $size: '$seats' } } } }
    ]),
  ]);

  const pendingPayments = await Payment.countDocuments({ companyId, status: 'pending', createdAt: { $gte: today, $lt: tomorrow } });

  return {
    todayBookings,
    todayRevenue: todayRevenue[0]?.total || 0,
    activeTrips,
    todayPassengers: todayPassengers[0]?.total || 0,
    pendingPayments,
  };
};

const getCustomerAnalytics = async (companyId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalCustomers, newCustomers, repeatCustomers] = await Promise.all([
    User.countDocuments({ companyId, role: 'customer' }),
    User.countDocuments({ companyId, role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
    Booking.aggregate([
      { $match: { companyId: companyId } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
      { $count: 'total' }
    ]),
  ]);

  return {
    totalCustomers,
    newCustomersThisMonth: newCustomers,
    repeatCustomers: repeatCustomers[0]?.total || 0,
    customerGrowthRate: totalCustomers ? Math.round((newCustomers / totalCustomers) * 100) : 0,
  };
};

const getPaymentAnalytics = async (companyId) => {
  const [paymentMethodDistribution, paymentStatusCounts] = await Promise.all([
    Payment.aggregate([
      { $match: { companyId: companyId } },
      { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]),
    Payment.aggregate([
      { $match: { companyId: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
  ]);

  const statusSummary = paymentStatusCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const totalPayments = paymentStatusCounts.reduce((sum, item) => sum + item.count, 0);
  const successCount = statusSummary.success || 0;

  return {
    paymentMethodDistribution,
    statusSummary,
    totalPayments,
    successRate: totalPayments ? Math.round((successCount / totalPayments) * 100) : 0,
  };
};

const getPeakDepartureTimes = async (companyId) => {
  return await Trip.aggregate([
    { $match: { companyId: companyId } },
    { $group: {
        _id: { $substr: ["$departureTime", 0, 2] },
        tripCount: { $sum: 1 },
        totalBookings: { $sum: "$seatsBooked" },
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = { getDashboardOverview, getRevenueAnalytics, getBookingAnalytics, getTripAnalytics, getUserAnalytics, getBookingTrends, getMonthlyRevenue, getRoutePerformance, getBusUtilization, getCancellationStats, getPeakDepartureTimes, getLiveTrips, getRecentBookings, getPaymentSummary, getAlerts, getTodayStats, getCustomerAnalytics, getPaymentAnalytics };
