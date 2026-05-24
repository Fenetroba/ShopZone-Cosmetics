const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrder, updateOrderStatus,
  cancelOrder, downloadInvoice, getSellerOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller', protect, authorize('seller', 'admin', 'superadmin'), getSellerOrders);
router.get('/:id', protect, getOrder);
router.get('/:id/invoice', protect, downloadInvoice);
router.put('/:id/status', protect, authorize('seller', 'admin', 'superadmin'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
