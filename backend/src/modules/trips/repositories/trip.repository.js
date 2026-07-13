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
 * Finds trips with optional filters and population.
 *
 * @param {Object} filters
 * @param {Array} populate
 * @returns {Promise<Array>}
 */
const findMany = async (filters, populate = []) => {
  let query = Trip.find(filters);
  populate.forEach((p) => { query = query.populate(p); });
  return await query;
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

module.exports = { findById, create, updateOne, incrementSeats, findMany, deleteOne };
