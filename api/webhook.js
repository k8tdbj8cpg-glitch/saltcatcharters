// api/webhook.js
// POST /webhook
// Processes payment status callbacks from Stripe and Coinbase Commerce

require('dotenv').config();

const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = req.headers['x-cc-webhook-signature']
    ? 'coinbase'
    : 'stripe';

  try {
    if (provider === 'stripe') {
      return await handleStripeWebhook(req, res);
    }
    return await handleCoinbaseWebhook(req, res);
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).json({ error: err.message });
  }
};

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // IMPORTANT: Stripe webhook verification requires the raw, unparsed request body.
    // In Vercel, configure this function with `"bodyParser": false` in vercel.json (see docs),
    // or read the raw body via req on('data') before Vercel's body parser runs.
    // When bodyParser is disabled, req.body will be a Buffer; otherwise it is a parsed object.
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('Stripe payment succeeded:', paymentIntent.id, paymentIntent.metadata);
      // TODO: Fulfill the booking/order (e.g., send confirmation email, update DB)
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.error('Stripe payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log('Stripe subscription invoice paid:', invoice.id, invoice.subscription);
      // TODO: Activate or renew Dream Log subscription
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('Stripe subscription cancelled:', subscription.id);
      // TODO: Deactivate Dream Log subscription
      break;
    }
    default:
      console.log('Unhandled Stripe event type:', event.type);
  }

  return res.status(200).json({ received: true });
}

async function handleCoinbaseWebhook(req, res) {
  const signature = req.headers['x-cc-webhook-signature'];
  // With bodyParser: false in vercel.json, req.body is a Buffer; handle all cases safely
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

  // Verify Coinbase Commerce webhook signature using HMAC-SHA256
  const expectedSig = crypto
    .createHmac('sha256', process.env.COINBASE_COMMERCE_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');

  if (signature !== expectedSig) {
    console.error('Coinbase signature verification failed');
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  switch (event.type) {
    case 'charge:confirmed': {
      const charge = event.data;
      console.log('Coinbase payment confirmed:', charge.id, charge.metadata);
      // TODO: Fulfill the booking/order (e.g., send confirmation email, update DB)
      break;
    }
    case 'charge:failed': {
      const charge = event.data;
      console.error('Coinbase payment failed:', charge.id);
      break;
    }
    case 'charge:pending': {
      const charge = event.data;
      console.log('Coinbase payment pending:', charge.id);
      break;
    }
    default:
      console.log('Unhandled Coinbase event type:', event.type);
  }

  return res.status(200).json({ received: true });
}

