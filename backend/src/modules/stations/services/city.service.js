const cityRepository = require('../repositories/city.repository');

/**
 * Lists all cities for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getAllCities = async (companyId) => {
  return await cityRepository.findAll(companyId);
};

/**
 * Fetches a single city by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getCityById = async (id, companyId) => {
  return await cityRepository.findById(id, companyId);
};

/**
 * Creates a city.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createCity = async (companyId, data) => {
  return await cityRepository.create({ ...data, companyId });
};

/**
 * Updates a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateCity = async (id, companyId, data) => {
  return await cityRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteCity = async (id, companyId) => {
  return await cityRepository.deleteOne(id, companyId);
};

module.exports = { getAllCities, getCityById, createCity, updateCity, deleteCity };
