const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const { generateUniqueSlug } = require('../utils/generateSlug');

// @desc    Get all products (with filters, search, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    search, category, brand, minPrice, maxPrice, minRating,
    sort = '-createdAt', page = 1, limit = 12, featured,
  } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }
  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (minRating) query.rating = { $gte: Number(minRating) };
  if (featured === 'true') query.isFeatured = true;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('seller', 'storeName storeLogo')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('seller', 'storeName storeLogo rating');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Track recently viewed
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { recentlyViewed: product._id },
      $slice: { recentlyViewed: -20 },
    });
  }

  res.json({ success: true, product });
});

// @desc    Create product (seller)
// @route   POST /api/products
// @access  Private/Seller
const createProduct = asyncHandler(async (req, res) => {
  let seller = await Seller.findOne({ user: req.user._id });
  if (!seller) {
    seller = await Seller.create({
      user: req.user._id,
      storeName: `${req.user.name}'s Store`,
      businessEmail: req.user.email,

    });
  } else if (seller.isActive == false && !['admin', 'superadmin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Seller account not approved');
  }

  const { title, description, price, discountPrice, stock, brand, category, tags, specifications, discount, sku, weight } = req.body;

  const slug = await generateUniqueSlug(Product, title);

  const product = await Product.create({
    title, description, price, discountPrice, stock, brand, category,
    tags: tags ? JSON.parse(tags) : [],
    specifications: specifications ? JSON.parse(specifications) : [],
    discount, sku, weight,
    images: req.files ? req.files.map((f) => f.path) : [],
    seller: seller._id,
    slug,
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let seller = await Seller.findOne({ user: req.user._id });
  if (!seller && ['seller', 'admin', 'superadmin'].includes(req.user.role)) {
    seller = await Seller.create({
      user: req.user._id,
      storeName: `${req.user.name}'s Store`,
      businessEmail: req.user.email,
      status: 'approved',
    });
  }

  if (!seller || product.seller.toString() !== seller._id.toString()) {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to update this product');
    }
  }

  const updates = { ...req.body };
  if (updates.tags && typeof updates.tags === 'string') updates.tags = JSON.parse(updates.tags);
  if (updates.specifications && typeof updates.specifications === 'string') updates.specifications = JSON.parse(updates.specifications);
  if (req.files && req.files.length > 0) {
    updates.images = [...(product.images || []), ...req.files.map((f) => f.path)];
  }
  if (updates.title && updates.title !== product.title) {
    updates.slug = await generateUniqueSlug(Product, updates.title, product._id);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, product: updated });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let seller = await Seller.findOne({ user: req.user._id });
  if (!seller && ['seller', 'admin', 'superadmin'].includes(req.user.role)) {
    seller = await Seller.create({
      user: req.user._id,
      storeName: `${req.user.name}'s Store`,
      businessEmail: req.user.email,
      status: 'approved',
    });
  }

  if (!seller || product.seller.toString() !== seller._id.toString()) {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized');
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Get seller's products
// @route   GET /api/products/seller/my-products
// @access  Private/Seller
const getSellerProducts = asyncHandler(async (req, res) => {
  let query = {};

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    let seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      seller = await Seller.create({
        user: req.user._id,
        storeName: `${req.user.name}'s Store`,
        businessEmail: req.user.email,
        status: 'approved',
      });
    }
    query.seller = seller._id;
  }

  const { page = 1, limit = 10, search } = req.query;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .populate('seller', 'storeName')
    .limit(8)
    .sort('-createdAt');

  res.json({ success: true, products });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .populate('category', 'name')
    .limit(6);

  res.json({ success: true, products: related });
});

module.exports = {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getSellerProducts, getFeaturedProducts, getRelatedProducts,
};
