const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, coupon });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ success: true, coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ success: true, message: 'Coupon deleted' });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon || new Date() > coupon.endDate) {
    res.status(400);
    throw new Error('Invalid or expired coupon');
  }

  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is $${coupon.minOrderAmount}`);
  }

  const userUsed = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
  if (userUsed >= coupon.userUsageLimit) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else {
    discount = coupon.discountValue;
  }

  res.json({ success: true, coupon, discount });
});

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
