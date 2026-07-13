const Config = require('../config.model');

/**
 * Finds or creates a config for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Object>}
 */
const findOrCreate = async (companyId) => {
  let config = await Config.findOne({ companyId });
  if (!config) {
    config = await Config.create({ companyId });
  }
  return config;
};

/**
 * Upserts config data for a company.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const upsert = async (companyId, data) => {
  let config = await Config.findOne({ companyId });
  if (!config) {
    config = await Config.create({ companyId, ...data });
  } else {
    Object.assign(config, data);
    await config.save();
  }
  return config;
};

/**
 * Resets config to defaults for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Object>}
 */
const reset = async (companyId) => {
  await Config.deleteOne({ companyId });
  return await Config.create({ companyId });
};

module.exports = { findOrCreate, upsert, reset };
