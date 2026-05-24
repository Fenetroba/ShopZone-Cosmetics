const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../config/cloudinary');

// Upload single image
router.post('/image', protect, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
}));

// Upload multiple images
router.post('/images', protect, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }
  const urls = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
  res.json({ success: true, images: urls });
}));

// Delete image
router.delete('/image/:publicId', protect, asyncHandler(async (req, res) => {
  await cloudinary.uploader.destroy(req.params.publicId);
  res.json({ success: true, message: 'Image deleted' });
}));

module.exports = router;
