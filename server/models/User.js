const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, minlength: 6 }, // optional for OAuth users
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin', 'superadmin'],
      default: 'customer',
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    addresses: [
      {
        label: String,
        street: String,
        city: String,
        state: String,
        country: String,
        zip: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    language: { type: String, default: 'en' },
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    refreshToken: String,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account has no password
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
