const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: issue tokens and save refresh token ────────────────────────────
const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const allowedRoles = ['customer', 'seller'];
  const userRole = allowedRoles.includes(role) ? role : 'customer';

  const user = await User.create({ name, email, password, role: userRole });

  if (userRole === 'seller') {
    await Seller.create({
      user: user._id,
      storeName: `${name}'s Store`,
      businessEmail: email,
      status: 'approved',
    });
  }

  sendEmail({
    to: email,
    subject: 'Welcome to ShopZone!',
    html: emailTemplates.welcomeEmail(name),
  }).catch(console.error);

  const { accessToken, refreshToken } = await issueTokens(user);

  res.status(201).json({ success: true, user, accessToken, refreshToken });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Block password login for Google-only accounts
  if (user.authProvider === 'google' && !user.password) {
    res.status(400);
    throw new Error('This account uses Google Sign-In. Please continue with Google.');
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact support.');
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({ success: true, user, accessToken, refreshToken });
});

// @desc    Google OAuth — verify credential token from frontend
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required');
  }

  // Verify the ID token with Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token. Please try again.');
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    res.status(400);
    throw new Error('Google account email is not verified.');
  }

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Existing user — link Google if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.isEmailVerified) user.isEmailVerified = true;
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Contact support.');
    }
  } else {
    // New user — create account
    user = await User.create({
      name,
      email,
      googleId,
      authProvider: 'google',
      avatar: picture || '',
      isEmailVerified: true,
      role: 'customer',
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Welcome to ShopZone!',
      html: emailTemplates.welcomeEmail(name),
    }).catch(console.error);
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({
    success: true,
    user,
    accessToken,
    refreshToken,
    isNewUser: !user.createdAt || Date.now() - user.createdAt < 5000,
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    res.status(401);
    throw new Error('Refresh token required');
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }

  const accessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, accessToken, refreshToken: newRefreshToken });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  let sellerProfile = null;

  if (user.role === 'seller') {
    sellerProfile = await Seller.findOne({ user: user._id });
    if (!sellerProfile) {
      sellerProfile = await Seller.create({
        user: user._id,
        storeName: `${user.name}'s Store`,
        businessEmail: user.email,
        status: 'approved',
      });
    }
  }

  res.json({ success: true, user, sellerProfile });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, language } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, avatar, language },
    { new: true, runValidators: true }
  );

  res.json({ success: true, user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Google-only users can set a password for the first time
  if (user.authProvider === 'google' && !user.password) {
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password set successfully' });
  }

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
