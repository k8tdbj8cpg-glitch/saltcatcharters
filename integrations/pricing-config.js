// pricing-config.js
// Centralised pricing for Salt Cat Charters and Dream Log App.
// All monetary values are in cents (USD) unless noted.

// ── Salt Cat Charters ────────────────────────────────────────────────────────

// One-time payment per charter day (e.g. $450.00)
const charterDayRate = {
    pricePerDay: 45000, // cents
    currency: 'usd',
};

// ── Dream Log App ────────────────────────────────────────────────────────────

// Flat-rate monthly subscription (e.g. $9.99/month)
const flatRateBilling = {
    price: 999,         // cents
    currency: 'usd',
    interval: 'month',
};

// One-off lifetime / feature-access payment (e.g. $29.99)
const oneTimeBilling = {
    price: 2999,        // cents
    currency: 'usd',
};

// Usage-based add-on billing (e.g. $0.10 per unit)
const usageBasedBilling = {
    pricePerUnit: 10,   // cents
    currency: 'usd',
};

// Stripe SDK – API key sourced from environment variable
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = { charterDayRate, flatRateBilling, oneTimeBilling, usageBasedBilling, stripe };