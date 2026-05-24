const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

// @desc    Get dashboard overview stats
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalOrders, totalProducts,
    revenueResult, pendingOrders, newUsersToday,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: revenueResult[0]?.total || 0,
      pendingOrders,
      newUsersToday,
    },
  });
});

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Admin
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  const salesData = await Order.aggregate([
    {
      $match: {
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

  res.json({ success: true, salesData });
});

// @desc    Get top products
// @route   GET /api/analytics/top-products
// @access  Private/Admin
const getTopProducts = asyncHandler(async (req, res) => {
  const topProducts = await Product.find({ isActive: true })
    .sort('-totalSold -rating')
    .limit(10)
    .populate('category', 'name')
    .populate('seller', 'storeName');

  res.json({ success: true, topProducts });
});

// @desc    Get user growth
// @route   GET /api/analytics/user-growth
// @access  Private/Admin
const getUserGrowth = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: daysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, userGrowth });
});

// @desc    Get order activity
// @route   GET /api/analytics/order-activity
// @access  Private/Admin
const getOrderActivity = asyncHandler(async (req, res) => {
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(10);

  res.json({ success: true, ordersByStatus, recentOrders });
});

// @desc    Get revenue breakdown
// @route   GET /api/analytics/revenue
// @access  Private/Admin
const getRevenueBreakdown = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
        status: { $nin: ['cancelled', 'refunded'] },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, monthlyRevenue });
});

module.exports = { getOverview, getSalesAnalytics, getTopProducts, getUserGrowth, getOrderActivity, getRevenueBreakdown };
