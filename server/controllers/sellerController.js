const asyncHandler = require('express-async-handler');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Register as seller
// @route   POST /api/sellers/register
// @access  Private
const registerSeller = asyncHandler(async (req, res) => {
  const existing = await Seller.findOne({ user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('Seller profile already exists');
  }

  const { storeName, storeDescription, businessEmail, businessPhone, businessAddress } = req.body;

  const seller = await Seller.create({
    user: req.user._id,
    storeName,
    storeDescription,
    businessEmail,
    businessPhone,
    businessAddress,
  });

  // Update user role
  await User.findByIdAndUpdate(req.user._id, { role: 'seller' });

  res.status(201).json({ success: true, seller });
});

// @desc    Get seller profile
// @route   GET /api/sellers/profile
// @access  Private/Seller
const getSellerProfile = asyncHandler(async (req, res) => {
  let seller = await Seller.findOne({ user: req.user._id }).populate('user', 'name email avatar');
  if (!seller) {
    if (['seller', 'admin', 'superadmin'].includes(req.user.role)) {
      seller = await Seller.create({
        user: req.user._id,
        storeName: `${req.user.name}'s Store`,
        businessEmail: req.user.email,
        status: 'approved',
      });
      seller = await Seller.findOne({ user: req.user._id }).populate('user', 'name email avatar');
    } else {
      res.status(404);
      throw new Error('Seller profile not found');
    }
  }
  res.json({ success: true, seller });
});

// @desc    Update seller profile
// @route   PUT /api/sellers/profile
// @access  Private/Seller
const updateSellerProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.files) {
    if (req.files.logo) updates.storeLogo = req.files.logo[0].path;
    if (req.files.banner) updates.storeBanner = req.files.banner[0].path;
  }

  let seller = await Seller.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!seller) {
    if (['seller', 'admin', 'superadmin'].includes(req.user.role)) {
      seller = await Seller.create({
        user: req.user._id,
        storeName: `${req.user.name}'s Store`,
        businessEmail: req.user.email,
        status: 'approved',
        ...updates,
      });
    } else {
      res.status(404);
      throw new Error('Seller not found');
    }
  }

  res.json({ success: true, seller });
});

// @desc    Get seller analytics
// @route   GET /api/sellers/analytics
// @access  Private/Seller
const getSellerAnalytics = asyncHandler(async (req, res) => {
  let seller = await Seller.findOne({ user: req.user._id });
  if (!seller) {
    if (['seller', 'admin', 'superadmin'].includes(req.user.role)) {
      seller = await Seller.create({
        user: req.user._id,
        storeName: `${req.user.name}'s Store`,
        businessEmail: req.user.email,
        status: 'approved',
      });
    } else {
      res.status(404);
      throw new Error('Seller not found');
    }
  }

  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  // Revenue over time
  const revenueData = await Order.aggregate([
    {
      $match: {
        'items.seller': seller._id,
        createdAt: { $gte: daysAgo },
        status: { $nin: ['cancelled', 'refunded'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top products
  const topProducts = await Order.aggregate([
    { $match: { 'items.seller': seller._id, status: { $nin: ['cancelled', 'refunded'] } } },
    { $unwind: '$items' },
    { $match: { 'items.seller': seller._id } },
    { $group: { _id: '$items.product', title: { $first: '$items.title' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  // Summary stats
  const totalOrders = await Order.countDocuments({ 'items.seller': seller._id });
  const totalProducts = await Product.countDocuments({ seller: seller._id, isActive: true });
  const pendingOrders = await Order.countDocuments({ 'items.seller': seller._id, status: 'pending' });

  res.json({
    success: true,
    analytics: {
      revenueData,
      topProducts,
      summary: {
        totalOrders,
        totalProducts,
        pendingOrders,
        totalRevenue: seller.totalRevenue,
        totalSales: seller.totalSales,
      },
    },
  });
});

// @desc    Get public seller store
// @route   GET /api/sellers/:id
// @access  Public
const getPublicSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id)
    .populate('user', 'name avatar createdAt');

  if (!seller || seller.status !== 'approved') {
    res.status(404);
    throw new Error('Seller not found');
  }

  const products = await Product.find({ seller: seller._id, isActive: true })
    .populate('category', 'name')
    .limit(12)
    .sort('-createdAt');

  res.json({ success: true, seller, products });
});

module.exports = { registerSeller, getSellerProfile, updateSellerProfile, getSellerAnalytics, getPublicSeller };
