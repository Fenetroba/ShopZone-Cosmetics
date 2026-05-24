const express = require('express');
const router = express.Router();
const { getOverview, getSalesAnalytics, getTopProducts, getUserGrowth, getOrderActivity, getRevenueBreakdown } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin', 'superadmin', 'seller'));

router.get('/overview', authorize('admin', 'superadmin'), getOverview);
router.get('/sales', getSalesAnalytics);
router.get('/top-products', getTopProducts);
router.get('/user-growth', authorize('admin', 'superadmin'), getUserGrowth);
router.get('/order-activity', authorize('admin', 'superadmin'), getOrderActivity);
router.get('/revenue', authorize('admin', 'superadmin'), getRevenueBreakdown);

module.exports = router;
