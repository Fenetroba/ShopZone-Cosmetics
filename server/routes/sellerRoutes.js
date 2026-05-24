const express = require('express');
const router = express.Router();
const { registerSeller, getSellerProfile, updateSellerProfile, getSellerAnalytics, getPublicSeller } = require('../controllers/sellerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', protect, registerSeller);
router.get('/profile', protect, authorize('seller', 'admin', 'superadmin'), getSellerProfile);
router.put('/profile', protect, authorize('seller', 'admin', 'superadmin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), updateSellerProfile);
router.get('/analytics', protect, authorize('seller', 'admin', 'superadmin'), getSellerAnalytics);
router.get('/:id', getPublicSeller);

module.exports = router;
