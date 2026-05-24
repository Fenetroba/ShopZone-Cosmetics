const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// Get recently viewed products
router.get('/recently-viewed', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'recentlyViewed',
    select: 'title images price discountPrice rating numReviews',
    options: { limit: 10 },
  });
  res.json({ success: true, products: user.recentlyViewed || [] });
}));

// Update address
router.post('/addresses', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

router.put('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  Object.assign(address, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

router.delete('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

module.exports = router;
