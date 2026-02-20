const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Helper to send token response
const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      wallet: user.wallet,
      creditScore: user.creditScore,
    },
  });
};

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['borrower', 'lender'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Choose borrower or lender' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      // Auto-verify for demo; admin must verify in production
      verified: true,
      // Give lenders starting wallet balance for demo
      wallet: role === 'lender' ? 50000 : 0,
    });

    // Welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to MicroFund!',
      message: `Your ${role} account has been created. ${role === 'lender' ? 'Your wallet has been pre-loaded with ₹50,000 for demo.' : 'Apply for your first loan to get started.'}`,
      type: 'system',
    });

    sendToken(user, 201, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        wallet: user.wallet,
        creditScore: user.creditScore,
        phone: user.phone,
        totalBorrowed: user.totalBorrowed,
        totalRepaid: user.totalRepaid,
        totalFunded: user.totalFunded,
        totalReturns: user.totalReturns,
        activeLoansCount: user.activeLoansCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
