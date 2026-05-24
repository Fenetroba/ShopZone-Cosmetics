const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
// @access  Private
const createStripeIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // cents
    currency: 'usd',
    metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret });
});

// @desc    Confirm Stripe payment
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    res.status(400);
    throw new Error('Payment not completed');
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      isPaid: true,
      paidAt: Date.now(),
      status: 'confirmed',
      paymentResult: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        updateTime: new Date().toISOString(),
        email: paymentIntent.receipt_email,
      },
      $push: { statusHistory: { status: 'confirmed', note: 'Payment received via Stripe' } },
    },
    { new: true }
  );

  await Payment.create({
    order: orderId,
    user: req.user._id,
    amount: order.totalPrice,
    method: 'stripe',
    status: 'completed',
    transactionId: paymentIntent.id,
    gatewayResponse: paymentIntent,
  });

  res.json({ success: true, order });
});

// @desc    Stripe webhook
// @route   POST /api/payments/stripe/webhook
// @access  Public (Stripe)
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { orderId } = paymentIntent.metadata;

    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: Date.now(),
      status: 'confirmed',
    });
  }

  res.json({ received: true });
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderNumber totalPrice status')
    .sort('-createdAt');

  res.json({ success: true, payments });
});

module.exports = { createStripeIntent, confirmStripePayment, stripeWebhook, getPaymentHistory };
