const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    storeDescription: { type: String, default: '' },
    storeLogo: { type: String, default: '' },
    storeBanner: { type: String, default: '' },
    businessEmail: { type: String, required: true },
    businessPhone: { type: String, default: '' },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
    },
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
    },
    documents: [String], // verification documents
    rejectionReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Seller', sellerSchema);
