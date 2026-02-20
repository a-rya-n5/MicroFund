const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route GET /api/users/wallet
router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet name email role creditScore totalBorrowed totalRepaid totalFunded totalReturns activeLoansCount');
    res.json({ success: true, wallet: user.wallet, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/users/wallet/topup
router.post('/wallet/topup', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > 100000) {
      return res.status(400).json({ success: false, message: 'Amount must be between ₹1 and ₹1,00,000' });
    }

    const user = await User.findById(req.user._id);
    const balanceBefore = user.wallet;
    user.wallet += amt;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'topup',
      amount: amt,
      direction: 'credit',
      description: 'Wallet top-up',
      balanceBefore,
      balanceAfter: user.wallet,
      reference: `TXN${Date.now()}`,
    });

    const Notification = require('../models/Notification');
    await Notification.create({
      user: user._id,
      title: 'Wallet Topped Up',
      message: `₹${amt} added to your wallet. New balance: ₹${user.wallet}`,
      type: 'topup',
    });

    res.json({ success: true, wallet: user.wallet, message: `₹${amt} added successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/users/transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await Transaction.find(query)
      .populate('loan', 'amount purpose borrower')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);
    res.json({ success: true, transactions, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/users/notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/users/notifications/:id/read
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/users/notifications/read-all
router.put('/notifications/read-all/mark', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/users/credit-score
router.get('/credit-score', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('creditScore creditHistory name');
    res.json({ success: true, creditScore: user.creditScore, history: user.creditHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/users/credit-simulate
// Simulate credit score change (demo tool)
router.post('/credit-simulate', protect, async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.user._id);
    let delta = 0, reason = '';

    switch (action) {
      case 'on_time_payment': delta = 5; reason = 'Simulated: On-time payment'; break;
      case 'late_payment': delta = -15; reason = 'Simulated: Late payment'; break;
      case 'missed_payment': delta = -30; reason = 'Simulated: Missed payment'; break;
      case 'new_loan': delta = -10; reason = 'Simulated: New loan inquiry'; break;
      case 'loan_closed': delta = 20; reason = 'Simulated: Loan fully repaid'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    user.updateCreditScore(delta, reason);
    await user.save();

    res.json({ success: true, creditScore: user.creditScore, delta, reason });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
