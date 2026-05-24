const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const { generateUniqueSlug } = require('../utils/generateSlug');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort('sortOrder name');
  res.json({ success: true, categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, sortOrder } = req.body;
  const slug = await generateUniqueSlug(Category, name);
  const image = req.file ? req.file.path : '';

  const category = await Category.create({ name, slug, description, parent, sortOrder, image });
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.image = req.file.path;
  if (updates.name) updates.slug = await generateUniqueSlug(Category, updates.name, req.params.id);

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
