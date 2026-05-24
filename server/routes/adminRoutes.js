const express = require('express');
const router = express.Router();
const {
  getUsers, updateUser, deleteUser,
  getSellers, updateSellerStatus,
  adminGetProducts, toggleProductStatus,
  adminGetOrders,
  getReviews, moderateReview,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin', 'superadmin'));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/sellers', getSellers);
router.put('/sellers/:id/status', updateSellerStatus);

router.get('/products', adminGetProducts);
router.put('/products/:id/toggle', toggleProductStatus);

router.get('/orders', adminGetOrders);

router.get('/reviews', getReviews);
router.put('/reviews/:id/moderate', moderateReview);

router.get('/audit-logs', authorize('superadmin'), getAuditLogs);

module.exports = router;
