const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0 },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0, min: 0 },
    brand: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    tags: [String],
    specifications: [{ key: String, value: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 }, // percentage
    sku: { type: String, unique: true, sparse: true },
    weight: { type: Number, default: 0 },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    lowStockThreshold: { type: Number, default: 5 },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, rating: -1 });

module.exports = mongoose.model('Product', productSchema);
