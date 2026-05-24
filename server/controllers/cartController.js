const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'title images price discountPrice stock isActive brand')
    .populate('coupon', 'code discountType discountValue');

  if (!cart) {
    return res.json({ success: true, cart: { items: [], totalPrice: 0 } });
  }

  // Filter out inactive products
  cart.items = cart.items.filter((item) => item.product && item.product.isActive);

  const totalPrice = cart.items.reduce((sum, item) => {
    const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  res.json({ success: true, cart, totalPrice });
});

// @desc    Add to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((i) => i.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
    existingItem.price = price;
  } else {
    cart.items.push({ product: productId, quantity, price });
  }

  await cart.save();
  await cart.populate('items.product', 'title images price discountPrice stock');

  res.json({ success: true, cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'title images price discountPrice stock');

  res.json({ success: true, cart });
});

// @desc    Remove from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();

  res.json({ success: true, message: 'Item removed from cart' });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null });
  res.json({ success: true, message: 'Cart cleared' });
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
// @access  Private
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  if (new Date() > coupon.endDate) {
    res.status(400);
    throw new Error('Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }

  const userUsed = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
  if (userUsed >= coupon.userUsageLimit) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { coupon: coupon._id },
    { new: true }
  ).populate('coupon', 'code discountType discountValue minOrderAmount');

  res.json({ success: true, cart, coupon });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon };
