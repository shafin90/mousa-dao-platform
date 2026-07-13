const Config = require('./config.model');

const getConfig = async (companyId) => {
  let config = await Config.findOne({ companyId });
  if (!config) {
    config = await Config.create({ companyId });
  }
  return config;
};

const updateConfig = async (companyId, data) => {
  let config = await Config.findOne({ companyId });
  if (!config) {
    config = await Config.create({ companyId, ...data });
  } else {
    Object.assign(config, data);
    await config.save();
  }
  return config;
};

const resetConfig = async (companyId) => {
  await Config.deleteOne({ companyId });
  return await Config.create({ companyId });
};

module.exports = { getConfig, updateConfig, resetConfig };
