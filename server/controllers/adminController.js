const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

// Users
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query).sort('-createdAt').skip(skip).limit(Number(limit));

  res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;

  // Prevent superadmin demotion by non-superadmin
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Only super admins can assign super admin role');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'superadmin') {
    res.status(403);
    throw new Error('Cannot delete super admin');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

// Sellers
const getSellers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Seller.countDocuments(query);
  const sellers = await Seller.find(query)
    .populate('user', 'name email avatar createdAt')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, sellers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const updateSellerStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const seller = await Seller.findByIdAndUpdate(
    req.params.id,
    { status, rejectionReason },
    { new: true }
  ).populate('user', 'name email');

  if (!seller) {
    res.status(404);
    throw new Error('Seller not found');
  }

  // Update user role if approved
  if (status === 'approved') {
    await User.findByIdAndUpdate(seller.user._id, { role: 'seller' });
  }

  res.json({ success: true, seller });
});

// Products
const adminGetProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, isActive } = req.query;
  const query = {};
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .populate('seller', 'storeName')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, products, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  product.isActive = !product.isActive;
  await product.save();
  res.json({ success: true, product });
});

// Orders
const adminGetOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.orderNumber = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// Reviews
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isApproved } = req.query;
  const query = {};
  if (isApproved !== undefined) query.isApproved = isApproved === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'title')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true }
  );
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  res.json({ success: true, review });
});

// Audit logs
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await AuditLog.countDocuments();
  const logs = await AuditLog.find()
    .populate('user', 'name email role')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

module.exports = {
  getUsers, updateUser, deleteUser,
  getSellers, updateSellerStatus,
  adminGetProducts, toggleProductStatus,
  adminGetOrders,
  getReviews, moderateReview,
  getAuditLogs,
};
