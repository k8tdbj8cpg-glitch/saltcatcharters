// The Stripe API key should be stored safely in an environment variable
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);