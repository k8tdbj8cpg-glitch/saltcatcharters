// Stripe Prebuilt Checkout Integration – Salt Cat Charters
// One-time payment for date-based fishing charter bookings.
//
// Usage:
//   const { createBookingCheckout } = require('./stripe-checkout');
//   const session = await createBookingCheckout({
//     dates: ['2026-06-01', '2026-06-02'],
//     pricePerDay: 45000,   // in cents (e.g. $450.00 per day)
//     customerEmail: 'guest@example.com',
//     successUrl: 'https://saltcatcharters.com/booking/success?session_id={CHECKOUT_SESSION_ID}',
//     cancelUrl:  'https://saltcatcharters.com/booking/cancel',
//   });
//   // Redirect the customer to session.url

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session for a Salt Cat Charters booking.
 *
 * @param {object}   opts
 * @param {string[]} opts.dates          - Array of date strings being booked (e.g. ['2026-06-01'])
 * @param {number}   opts.pricePerDay    - Per-day price in cents
 * @param {string}   [opts.customerEmail]
 * @param {string}   opts.successUrl     - URL Stripe redirects to on success
 * @param {string}   opts.cancelUrl      - URL Stripe redirects to on cancel
 * @returns {Promise<Stripe.Checkout.Session>}
 */
async function createBookingCheckout({ dates, pricePerDay, customerEmail, successUrl, cancelUrl }) {
    if (!dates || dates.length === 0) {
        throw new Error('At least one booking date is required.');
    }

    const lineItems = dates.map((date) => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: `Salt Cat Charters – ${date}`,
                description: 'Full-day fishing charter',
            },
            unit_amount: pricePerDay,
        },
        quantity: 1,
    }));

    const sessionParams = {
        mode: 'payment',
        line_items: lineItems,
        payment_method_types: ['card'],
        success_url: successUrl,
        cancel_url: cancelUrl,
    };

    if (customerEmail) {
        sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
}

module.exports = { createBookingCheckout };