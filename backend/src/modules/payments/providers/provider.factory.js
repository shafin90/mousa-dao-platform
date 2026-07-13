const FlutterwaveProvider = require('./flutterwave.provider');

class ProviderFactory {
  static getProvider(name) {
    const providerName = (name || 'flutterwave').toLowerCase();
    switch (providerName) {
      case 'flutterwave':
        return new FlutterwaveProvider();
      default:
        throw new Error(`Payment provider ${name} is not supported`);
    }
  }
}

module.exports = ProviderFactory;
