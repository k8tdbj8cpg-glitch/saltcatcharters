// api/create-charge.js
// POST /create-charge
// Handles payment charge creation for Salt Cat Charters and Dream Log app
// Supports Stripe (cards, Apple Pay) and Coinbase Commerce (BTC, ETH)

require('dotenv').config();

const https = require('https');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    app,           // 'saltcat' or 'dreamlog'
    paymentMethod, // 'stripe' or 'coinbase'
    amount,        // amount in cents (for Stripe) or USD (for Coinbase)
    currency,      // 'usd', 'btc', 'eth'
    description,   // booking or subscription description
    customerEmail,
    // Salt Cat Charters specific
    bookingDate,
    // Dream Log specific
    planType,      // 'monthly' or 'onetime'
  } = req.body;

  if (!app || !paymentMethod || !amount || !description || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (paymentMethod === 'stripe') {
      return await handleStripeCharge(res, {
        app,
        amount,
        description,
        customerEmail,
        bookingDate,
        planType,
      });
    }

    if (paymentMethod === 'coinbase') {
      return await handleCoinbaseCharge(res, {
        app,
        amount,
        currency: currency || 'usd',
        description,
        customerEmail,
        bookingDate,
        planType,
      });
    }

    return res.status(400).json({ error: 'Invalid payment method. Use "stripe" or "coinbase".' });
  } catch (err) {
    console.error('Error creating charge:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

async function handleStripeCharge(res, { app, amount, description, customerEmail, bookingDate, planType }) {
  // Dream Log subscriptions use Stripe Subscriptions
  if (app === 'dreamlog' && planType === 'monthly') {
    const customer = await stripe.customers.create({ email: customerEmail });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.DREAM_LOG_MONTHLY_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return res.status(200).json({
      type: 'subscription',
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  }

  // One-time payments for Salt Cat Charters and Dream Log one-time charges
  const metadata = { app, customerEmail };
  if (bookingDate) metadata.bookingDate = bookingDate;
  if (planType) metadata.planType = planType;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    description,
    receipt_email: customerEmail,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  return res.status(200).json({
    type: 'payment_intent',
    clientSecret: paymentIntent.client_secret,
  });
}

async function handleCoinbaseCharge(res, { app, amount, currency, description, customerEmail, bookingDate, planType }) {
  const metadata = { app, customerEmail };
  if (bookingDate) metadata.bookingDate = bookingDate;
  if (planType) metadata.planType = planType;

  const chargeData = {
    name: app === 'saltcat' ? 'Salt Cat Charters Booking' : 'Dream Log App',
    description,
    pricing_type: 'fixed_price',
    local_price: {
      // Coinbase expects dollar amounts; input amount is in cents (Stripe format), so divide by 100
      amount: (amount / 100).toFixed(2),
      currency: currency.toUpperCase() === 'USD' ? 'USD' : currency.toUpperCase(),
    },
    metadata,
    redirect_url: process.env.PAYMENT_SUCCESS_URL || 'https://saltcatcharters.com/payment-success',
    cancel_url: process.env.PAYMENT_CANCEL_URL || 'https://saltcatcharters.com/payment-cancel',
  };

  const charge = await coinbaseRequest('POST', '/charges', chargeData);

  return res.status(200).json({
    type: 'coinbase_charge',
    chargeId: charge.data.id,
    hostedUrl: charge.data.hosted_url,
    expiresAt: charge.data.expires_at,
  });
}

/**
 * Make an authenticated request to the Coinbase Commerce REST API.
 * Uses built-in https to avoid vulnerable third-party HTTP client packages.
 */
function coinbaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.commerce.coinbase.com',
      port: 443,
      path,
      method,
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (coinbaseRes) => {
      let data = '';
      coinbaseRes.on('data', (chunk) => { data += chunk; });
      coinbaseRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (coinbaseRes.statusCode >= 400) {
            return reject(new Error(`Coinbase Commerce error ${coinbaseRes.statusCode}: ${JSON.stringify(parsed)}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse Coinbase response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

