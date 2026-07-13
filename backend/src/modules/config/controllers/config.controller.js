const configRepository = require('../repositories/config.repository');
const { respond } = require('../../../utils/response');

const getConfig = async (req, res, next) => {
  try {
    const config = await configRepository.findOrCreate(req.user.companyId);
    respond(res, 200, config);
  } catch (error) { next(error); }
};

const updateConfig = async (req, res, next) => {
  try {
    const config = await configRepository.upsert(req.user.companyId, req.body);
    respond(res, 200, config, 'Configuration updated');
  } catch (error) { next(error); }
};

const resetConfig = async (req, res, next) => {
  try {
    const config = await configRepository.reset(req.user.companyId);
    respond(res, 200, config, 'Configuration reset');
  } catch (error) { next(error); }
};

module.exports = { getConfig, updateConfig, resetConfig };
