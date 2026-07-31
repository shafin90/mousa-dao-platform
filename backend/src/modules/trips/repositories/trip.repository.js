const Trip = require('../models/Trip');

/**
 * Finds a trip by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Array} [populate] - Population specs to apply
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId, populate = []) => {
  let query = Trip.findOne({ _id: id, companyId });
  populate.forEach((p) => { query = query.populate(p); });
  return await query;
};

/**
 * Creates a trip record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Trip.create(data);
};

/**
 * Updates a trip by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await Trip.findOneAndUpdate({ _id: id, companyId }, update, { new: true });
};

/**
 * Increments or decrements seatsBooked on a trip.
 *
 * @param {string} tripId
 * @param {number} delta - Positive to increment, negative to decrement
 * @param {Object} [session]
 * @returns {Promise<Object|null>}
 */
const incrementSeats = async (tripId, delta, session) => {
  const opts = { new: true };
  if (session) opts.session = session;
  return await Trip.findByIdAndUpdate(tripId, { $inc: { seatsBooked: delta } }, opts);
};

/**
 * Finds trips with optional filters, pagination and population.
 *
 * @param {Object} filters
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {Array} [options.populate=[]]
 * @returns {Promise<{items: Array, total: number}>}
 */
const findMany = async (filters, options = {}) => {
  const { page = 1, limit = 20, populate = [], sort = { date: 1, departureTime: 1 } } = options;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Trip.find(filters).populate(populate).sort(sort).skip(skip).limit(limit),
    Trip.countDocuments(filters),
  ]);

  return { items, total };
};

/**
 * Deletes a trip by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await Trip.findOneAndDelete({ _id: id, companyId });
};

const deleteMany = async (companyId) => {
  return await Trip.deleteMany({ companyId });
};

module.exports = { findById, create, updateOne, incrementSeats, findMany, deleteOne, deleteMany };
