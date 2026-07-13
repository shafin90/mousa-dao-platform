const BasePaymentProvider = require('./base.provider');

class FlutterwaveProvider extends BasePaymentProvider {
  constructor() {
    super();
    this.publicKey = process.env.FLW_PUBLIC_KEY;
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.baseUrl = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';
  }

  async initializePayment(params) {
    const { tx_ref, amount, currency, email, name, meta } = params;

    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: currency || 'XOF',
        redirect_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/payments/callback`,
        customer: {
          email,
          name: name || 'Customer'
        },
        meta,
        customizations: {
          title: 'Jet Transport Payments',
          description: 'Payment for booking'
        }
      })
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
      throw new Error(`Flutterwave initialization failed: ${data.message || response.statusText}`);
    }

    return {
      paymentLink: data.data.link,
      status: 'pending'
    };
  }

  async verifyTransaction(transactionId) {
    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
      throw new Error(`Flutterwave verification failed: ${data.message || response.statusText}`);
    }

    const { status: flwStatus, amount, currency, tx_ref } = data.data;

    let mappedStatus = 'failed';
    if (flwStatus === 'successful') {
      mappedStatus = 'success';
    } else if (flwStatus === 'failed') {
      mappedStatus = 'failed';
    } else if (flwStatus === 'pending') {
      mappedStatus = 'pending';
    }

    return {
      status: mappedStatus,
      amount,
      currency,
      tx_ref,
      rawData: data.data
    };
  }
}

module.exports = FlutterwaveProvider;
