const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getCart);
router.post('/', addToCart);
router.post('/coupon', applyCoupon);
router.put('/:productId', updateCartItem);
router.delete('/', clearCart);
router.delete('/:productId', removeFromCart);

module.exports = router;
