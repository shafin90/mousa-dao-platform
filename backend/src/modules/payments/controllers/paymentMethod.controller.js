const paymentMethodRepository = require('../repositories/paymentMethod.repository');
const { respond } = require('../../../utils/response');

const getMyPaymentMethods = async (req, res, next) => {
  try {
    const methods = await paymentMethodRepository.findByUser(req.user._id, req.user.companyId);
    respond(res, 200, methods);
  } catch (error) { next(error); }
};

const addPaymentMethod = async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.user._id, companyId: req.user.companyId };
    if (data.isDefault) {
      await paymentMethodRepository.unsetDefault(req.user._id, req.user.companyId);
    }
    const method = await paymentMethodRepository.create(data);
    respond(res, 201, method, 'Payment method added');
  } catch (error) { next(error); }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const method = await paymentMethodRepository.deleteOne(req.params.id, req.user._id, req.user.companyId);
    if (!method) return respond(res, 404, null, 'Payment method not found');
    respond(res, 200, null, 'Payment method deleted');
  } catch (error) { next(error); }
};

const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const method = await paymentMethodRepository.findById(req.params.id, req.user._id, req.user.companyId);
    if (!method) return respond(res, 404, null, 'Payment method not found');
    await paymentMethodRepository.unsetDefault(req.user._id, req.user.companyId);
    const updated = await paymentMethodRepository.updateOne(req.params.id, req.user._id, req.user.companyId, { isDefault: true });
    respond(res, 200, updated, 'Default payment method updated');
  } catch (error) { next(error); }
};

module.exports = { getMyPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod };
