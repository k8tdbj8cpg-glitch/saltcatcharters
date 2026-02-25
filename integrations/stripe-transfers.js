// Stripe Transfer Integration

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment transfer to a connected Stripe account
async function createTransfer(amount, destination, currency = 'usd') {
    try {
        const transfer = await stripe.transfers.create({
            amount,
            currency,
            destination,
        });
        console.log('Transfer created successfully:', transfer.id);
        return transfer;
    } catch (error) {
        console.error('Error creating transfer:', error.message);
        throw error;
    }
}

// Retrieve an existing transfer by its Stripe transfer ID
async function getTransfer(transferId) {
    try {
        const transfer = await stripe.transfers.retrieve(transferId);
        console.log('Transfer retrieved successfully:', transfer.id);
        return transfer;
    } catch (error) {
        console.error('Error retrieving transfer:', error.message);
        throw error;
    }
}

module.exports = { createTransfer, getTransfer };
