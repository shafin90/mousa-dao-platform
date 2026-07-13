const Route = require('../models/Route');

const stopsPopulate = { path: 'stops.cityId', select: 'name' };

/**
 * Finds a route by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Route.findOne({ _id: id, companyId })
    .populate('fromStation toStation')
    .populate(stopsPopulate);
};

/**
 * Creates a route record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Route.create(data);
};

/**
 * Lists all routes for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findAll = async (companyId) => {
  return await Route.find({ companyId })
    .populate('fromStation toStation')
    .populate(stopsPopulate);
};

/**
 * Updates a route by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await Route.findOneAndUpdate({ _id: id, companyId }, update, { new: true })
    .populate('fromStation toStation')
    .populate(stopsPopulate);
};

/**
 * Deletes a route by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await Route.findOneAndDelete({ _id: id, companyId });
};

/**
 * Finds routes matching a query (used in trip filtering).
 *
 * @param {Object} query
 * @returns {Promise<Array>}
 */
const findWhere = async (query) => {
  return await Route.find(query).select('_id');
};

module.exports = { findById, create, findAll, updateOne, deleteOne, findWhere };
