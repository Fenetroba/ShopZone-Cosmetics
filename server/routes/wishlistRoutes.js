const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
