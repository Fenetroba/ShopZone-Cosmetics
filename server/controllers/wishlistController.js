const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');

// @desc    Get wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate('products', 'title images price discountPrice rating numReviews brand isActive');

  if (!wishlist) {
    return res.json({ success: true, wishlist: { products: [] } });
  }

  // Filter out inactive products
  wishlist.products = wishlist.products.filter((p) => p && p.isActive);
  res.json({ success: true, wishlist });
});

// @desc    Toggle wishlist item
// @route   POST /api/wishlist/:productId
// @access  Private
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const index = wishlist.products.indexOf(productId);
  let action;

  if (index > -1) {
    wishlist.products.splice(index, 1);
    action = 'removed';
  } else {
    wishlist.products.push(productId);
    action = 'added';
  }

  await wishlist.save();
  res.json({ success: true, action, wishlist });
});

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } }
  );
  res.json({ success: true, message: 'Removed from wishlist' });
});

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
