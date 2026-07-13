const configService = require('./config.service');

const getConfig = async (req, res) => {
  try {
    const config = await configService.getConfig(req.user.companyId);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    const config = await configService.updateConfig(req.user.companyId, req.body);
    res.json({ success: true, message: 'Configuration updated', data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetConfig = async (req, res) => {
  try {
    const config = await configService.resetConfig(req.user.companyId);
    res.json({ success: true, message: 'Configuration reset to defaults', data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getConfig, updateConfig, resetConfig };
