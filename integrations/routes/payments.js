// Payment API Routes

const express = require('express');
const router = express.Router();
const { createTransfer, getTransfer } = require('../stripe-transfers');

// Authentication middleware
function authenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.PAYMENTS_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// POST /payments - Create a new payment transfer
router.post('/', authenticate, async (req, res) => {
    const { amount, destination, currency } = req.body;
    if (!amount || !destination) {
        return res.status(400).json({ error: 'amount and destination are required' });
    }
    try {
        const transfer = await createTransfer(amount, destination, currency);
        res.status(201).json({ transfer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /payments/:transferId - Retrieve an existing payment transfer
router.get('/:transferId', authenticate, async (req, res) => {
    const { transferId } = req.params;
    try {
        const transfer = await getTransfer(transferId);
        res.json({ transfer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
