const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { product: req.params.productId, isApproved: true };
  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('user', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    reviews,
    distribution,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment, orderId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if already reviewed
  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Check verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      'items.product': productId,
      status: 'delivered',
    });
    isVerifiedPurchase = !!order;
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: orderId,
    rating,
    title,
    comment,
    isVerifiedPurchase,
    images: req.files ? req.files.map((f) => f.path) : [],
  });

  // Update product rating
  const stats = await Review.aggregate([
    { $match: { product: product._id, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  }

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { rating, title, comment } = req.body;
  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;
  await review.save();

  // Recalculate product rating
  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  }

  res.json({ success: true, review });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const productId = review.product;
  await review.deleteOne();

  // Recalculate
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    numReviews: stats.length > 0 ? stats[0].count : 0,
  });

  res.json({ success: true, message: 'Review deleted' });
});

// @desc    Admin create review on behalf of a user
// @route   POST /api/reviews/admin
// @access  Private/Admin
const adminCreateReview = asyncHandler(async (req, res) => {
  const { productId, userId, rating, title, comment, isVerifiedPurchase } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if this user already reviewed this product
  const existing = await Review.findOne({ user: userId, product: productId });
  if (existing) {
    res.status(400);
    throw new Error('This user has already reviewed this product');
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!isVerifiedPurchase,
    isApproved: true,
    images: [],
  });

  // Recalculate product rating
  const stats = await Review.aggregate([
    { $match: { product: product._id, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  }

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview, adminCreateReview };
