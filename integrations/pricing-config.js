// pricing-config.js
require('dotenv').config();

// Salt Cat Charters – one-time booking prices (in USD cents)
const saltCatPricing = {
    halfDay: { amount: 25000, currency: 'usd', description: 'Half Day Charter' },
    fullDay: { amount: 45000, currency: 'usd', description: 'Full Day Charter' },
};

// Dream Log App – flat-rate and usage-based billing configuration
const flatRateBilling = {
    price: 999,       // $9.99/month in cents
    currency: 'usd',
    interval: 'month',
};

const usageBasedBilling = {
    pricePerUnit: 100, // $1.00 per unit in cents
    currency: 'usd',
};

// Stripe instance using environment variable for API key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = { saltCatPricing, flatRateBilling, usageBasedBilling, stripe };