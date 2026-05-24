const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    method: { type: String, enum: ['stripe', 'paypal', 'chapa', 'cod'], required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    refundId: String,
    refundAmount: Number,
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
