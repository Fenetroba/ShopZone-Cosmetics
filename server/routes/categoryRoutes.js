const express = require('express');
const router = express.Router();
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getCategories);
router.get('/:slug', getCategory);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), createCategory);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteCategory);

module.exports = router;
