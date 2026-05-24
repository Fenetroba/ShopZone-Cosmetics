const express = require('express');
const router = express.Router();
const { createStripeIntent, confirmStripePayment, stripeWebhook, getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/confirm', protect, confirmStripePayment);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
