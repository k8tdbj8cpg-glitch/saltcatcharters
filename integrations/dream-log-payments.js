// Dream Log App – Stripe Payment Integration
// Supports:
//   • Monthly subscription  (card, Apple Pay, Google Pay)
//   • One-time payment      (card, Apple Pay, Google Pay)
//   • Crypto payments       (Bitcoin / Ethereum via Stripe's crypto payment method)
//
// Usage:
//   const { createSubscriptionCheckout, createOneTimeCheckout } = require('./dream-log-payments');
//
//   // Monthly subscription
//   const session = await createSubscriptionCheckout({
//     stripePriceId: 'price_XXXXXXXXXXXXXXXX',   // monthly recurring Price ID from Stripe Dashboard
//     customerEmail: 'user@example.com',
//     successUrl: 'https://app.dreamlog.com/success?session_id={CHECKOUT_SESSION_ID}',
//     cancelUrl:  'https://app.dreamlog.com/cancel',
//   });
//
//   // One-time payment (includes crypto)
//   const session = await createOneTimeCheckout({
//     amount: 2999,   // cents – e.g. $29.99
//     name: 'Dream Log – Lifetime Access',
//     customerEmail: 'user@example.com',
//     successUrl: 'https://app.dreamlog.com/success?session_id={CHECKOUT_SESSION_ID}',
//     cancelUrl:  'https://app.dreamlog.com/cancel',
//     enableCrypto: true,
//   });
//
//   // Redirect customer to session.url

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Payment methods available for card/wallet payments
const CARD_PAYMENT_METHODS = ['card'];

// Crypto payment methods supported by Stripe
// See: https://stripe.com/docs/payments/crypto
const CRYPTO_PAYMENT_METHODS = ['crypto'];

/**
 * Create a Stripe Checkout Session for a Dream Log monthly subscription.
 *
 * @param {object}  opts
 * @param {string}  opts.stripePriceId   - Recurring Price ID created in the Stripe Dashboard
 * @param {string}  [opts.customerEmail]
 * @param {string}  opts.successUrl
 * @param {string}  opts.cancelUrl
 * @returns {Promise<Stripe.Checkout.Session>}
 */
async function createSubscriptionCheckout({ stripePriceId, customerEmail, successUrl, cancelUrl }) {
    if (!stripePriceId) {
        throw new Error('stripePriceId is required for subscription checkout.');
    }

    const sessionParams = {
        mode: 'subscription',
        line_items: [{ price: stripePriceId, quantity: 1 }],
        payment_method_types: CARD_PAYMENT_METHODS,
        success_url: successUrl,
        cancel_url: cancelUrl,
    };

    if (customerEmail) {
        sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
}

/**
 * Create a Stripe Checkout Session for a one-time Dream Log payment.
 * Optionally enables crypto payment methods (BTC / ETH).
 *
 * @param {object}  opts
 * @param {number}  opts.amount          - Amount in cents
 * @param {string}  opts.name            - Product / feature name shown on checkout
 * @param {string}  [opts.customerEmail]
 * @param {string}  opts.successUrl
 * @param {string}  opts.cancelUrl
 * @param {boolean} [opts.enableCrypto]  - Include Stripe crypto payment methods
 * @returns {Promise<Stripe.Checkout.Session>}
 */
async function createOneTimeCheckout({ amount, name, customerEmail, successUrl, cancelUrl, enableCrypto = false }) {
    const paymentMethodTypes = enableCrypto
        ? [...CARD_PAYMENT_METHODS, ...CRYPTO_PAYMENT_METHODS]
        : CARD_PAYMENT_METHODS;

    const sessionParams = {
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name },
                    unit_amount: amount,
                },
                quantity: 1,
            },
        ],
        payment_method_types: paymentMethodTypes,
        success_url: successUrl,
        cancel_url: cancelUrl,
    };

    if (customerEmail) {
        sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
}

module.exports = { createSubscriptionCheckout, createOneTimeCheckout };
