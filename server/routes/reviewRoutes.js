const express = require('express');
const router = express.Router();
const { getProductReviews, createReview, updateReview, deleteReview, adminCreateReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, upload.array('images', 3), createReview);
router.post('/admin', protect, authorize('admin', 'superadmin'), adminCreateReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
