const Ticket = require('../models/Ticket');

/**
 * Finds a ticket by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Ticket.findOne({ _id: id, companyId });
};

/**
 * Finds a ticket by booking ID within company.
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findByBooking = async (bookingId, companyId) => {
  return await Ticket.findOne({ bookingId, companyId });
};

/**
 * Creates a ticket record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Ticket.create(data);
};

/**
 * Lists tickets for a company with filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { status, tripId, userId, search }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{tickets: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;
  if (filters.tripId) query.tripId = filters.tripId;
  if (filters.userId) query.userId = filters.userId;
  const tickets = await Ticket.find(query)
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Ticket.countDocuments(query);
  return { tickets, total };
};

/**
 * Finds tickets for a user within company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findByUser = async (userId, companyId) => {
  return await Ticket.find({ userId, companyId });
};

/**
 * Finds a ticket by QR data or ID and updates to used.
 *
 * @param {string} companyId
 * @param {Object} query - { _id or qrCode }
 * @returns {Promise<Object|null>}
 */
const findAndMarkUsed = async (companyId, query) => {
  return await Ticket.findOneAndUpdate(
    { ...query, companyId, status: 'valid' },
    { $set: { status: 'used', scannedAt: new Date() } },
    { new: true }
  );
};

module.exports = { findById, findByBooking, create, findMany, findByUser, findAndMarkUsed };
