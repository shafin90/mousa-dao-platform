const { publishToQueue, queues } = require('../../queue/index');
const bookingService = require('./booking.service');
const { v4: uuidv4 } = require('uuid');

const createBooking = async (req, res) => {
  try {
    const eventId = uuidv4();
    await publishToQueue(queues.BOOKING_QUEUE, {
      eventType: 'CREATE_BOOKING',
      eventId,
      companyId: req.user.companyId,
      userId: req.user._id,
      ...req.body,
      timestamp: new Date()
    });
    
    res.status(202).json({ success: true, message: 'Booking request received and is being processed', eventId });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id, req.user.companyId);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await bookingService.getAllBookings(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getUserBookings, getAllBookings, getBookingById, cancelBooking };
