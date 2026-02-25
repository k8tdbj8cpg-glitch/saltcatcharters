// stripe-checkout.js
// Stripe Checkout and Payment Intents integration helper
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Payment Intent for a one-time charge.
 * @param {number} amount - Amount in cents (e.g. 25000 = $250.00)
 * @param {string} description - Human-readable description
 * @param {string} customerEmail - Customer's email address
 * @param {object} metadata - Additional metadata (app, bookingDate, etc.)
 * @returns {Promise<object>} - Stripe PaymentIntent object
 */
async function createPaymentIntent(amount, description, customerEmail, metadata = {}) {
    return stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        description,
        receipt_email: customerEmail,
        metadata,
        automatic_payment_methods: { enabled: true },
    });
}

/**
 * Create a Stripe Checkout Session for a one-time or subscription payment.
 * @param {string} priceId - Stripe Price ID
 * @param {string} mode - 'payment' (one-time) or 'subscription'
 * @param {string} successUrl - URL to redirect after success
 * @param {string} cancelUrl - URL to redirect after cancellation
 * @returns {Promise<object>} - Stripe Session object
 */
async function createCheckoutSession(priceId, mode, successUrl, cancelUrl) {
    return stripe.checkout.sessions.create({
        mode,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ['card'],
    });
}

module.exports = { stripe, createPaymentIntent, createCheckoutSession };