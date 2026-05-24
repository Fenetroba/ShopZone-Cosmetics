const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Seller = require('../models/Seller');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { generateOrderPDF } = require('../utils/generatePDF');

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Validate products and calculate prices
  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product).populate('seller');
    if (!product || !product.isActive) {
      res.status(404);
      throw new Error(`Product ${item.product} not found`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    itemsPrice += price * item.quantity;

    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.images[0] || '',
      price,
      quantity: item.quantity,
      seller: product.seller._id,
    });
  }

  // Apply coupon
  let discountAmount = 0;
  let couponId = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && new Date() <= coupon.endDate && itemsPrice >= coupon.minOrderAmount) {
      if (coupon.discountType === 'percentage') {
        discountAmount = (itemsPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      } else {
        discountAmount = coupon.discountValue;
      }
      couponId = coupon._id;
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: req.user._id },
      });
    }
  }

  const shippingPrice = itemsPrice > 50 ? 0 : 9.99;
  const taxPrice = Number((itemsPrice * 0.1).toFixed(2));
  const totalPrice = Number((itemsPrice - discountAmount + shippingPrice + taxPrice).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    totalPrice,
    coupon: couponId,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
    isPaid: paymentMethod === 'cod' ? false : false,
  });

  // Reduce stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, totalSold: item.quantity },
    });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null });

  // Send confirmation email
  sendEmail({
    to: req.user.email,
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: emailTemplates.orderConfirmation(order),
  }).catch(console.error);

  res.status(201).json({ success: true, order });
});

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('items.product', 'title images')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'title images slug');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only owner, seller, or admin can view
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !['admin', 'superadmin'].includes(req.user.role)
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }

  res.json({ success: true, order });
});

// @desc    Update order status (seller/admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Seller/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'email name');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || '' });
  if (trackingNumber) order.trackingNumber = trackingNumber;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  await order.save();

  if (status === 'shipped') {
    sendEmail({
      to: order.user.email,
      subject: `Your Order #${order.orderNumber} Has Shipped!`,
      html: emailTemplates.orderShipped(order),
    }).catch(console.error);
  }

  res.json({ success: true, order });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by customer' });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, totalSold: -item.quantity },
    });
  }

  res.json({ success: true, order });
});

// @desc    Download order invoice PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const pdfBuffer = await generateOrderPDF(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
  res.send(pdfBuffer);
});

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private/Seller
const getSellerOrders = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) {
    res.status(404);
    throw new Error('Seller not found');
  }

  const { page = 1, limit = 10, status } = req.query;
  const query = { 'items.seller': seller._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('items.product', 'title images')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

module.exports = {
  createOrder, getMyOrders, getOrder, updateOrderStatus,
  cancelOrder, downloadInvoice, getSellerOrders,
};
