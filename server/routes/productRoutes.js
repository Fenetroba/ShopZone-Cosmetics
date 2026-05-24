const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getSellerProducts, getFeaturedProducts, getRelatedProducts,
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/seller/my-products', protect, authorize('seller', 'admin', 'superadmin'), getSellerProducts);
router.get('/:slug', optionalAuth, getProduct);
router.get('/:id/related', getRelatedProducts);
router.post('/', protect, authorize('seller', 'admin', 'superadmin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('seller', 'admin', 'superadmin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin', 'superadmin'), deleteProduct);

module.exports = router;
