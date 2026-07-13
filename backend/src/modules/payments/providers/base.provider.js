class BasePaymentProvider {
  async initializePayment(params) {
    throw new Error('initializePayment method must be implemented');
  }

  async verifyTransaction(transactionId) {
    throw new Error('verifyTransaction method must be implemented');
  }
}

module.exports = BasePaymentProvider;
