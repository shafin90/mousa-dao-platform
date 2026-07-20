const Route = require('../models/Route');

const stopsPopulate = [
  { path: 'stops.cityId', select: 'name' },
  { path: 'stops.stationId', select: 'name' },
];
const stationPopulate = { path: 'fromStations toStations', select: 'name' };
const userPopulate = { path: 'createdBy', select: 'profile.firstName profile.lastName email' };

/**
 * Finds a route by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Route.findOne({ _id: id, companyId })
    .populate('fromCity toCity')
    .populate(stopsPopulate)
    .populate(stationPopulate)
    .populate(userPopulate);
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
    .populate('fromCity toCity')
    .populate(stopsPopulate)
    .populate(stationPopulate);
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
    .populate('fromCity toCity')
    .populate(stopsPopulate)
    .populate(stationPopulate)
    .populate(userPopulate);
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
