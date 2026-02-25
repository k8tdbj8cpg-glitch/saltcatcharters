// Stripe Webhook Handler

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Handle incoming Stripe webhook events
function handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error.message);
        return res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }

    if (event.type === 'transfer.updated') {
        const transfer = event.data.object;
        console.log('Transfer updated:', transfer.id, '| Status:', transfer.reversed ? 'reversed' : 'active');

        // Handle business flow changes based on transfer status
        if (transfer.reversed) {
            console.log('Transfer reversed - initiating reversal workflow for transfer:', transfer.id);
        } else {
            console.log('Transfer active - confirming payment for transfer:', transfer.id);
        }
    }

    res.json({ received: true });
}

module.exports = { handleWebhook };
