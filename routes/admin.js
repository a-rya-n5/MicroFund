const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin')];

// @route GET /api/admin/stats
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalLoans, totalBorrowers, totalLenders] = await Promise.all([
      User.countDocuments(),
      Loan.countDocuments(),
      User.countDocuments({ role: 'borrower' }),
      User.countDocuments({ role: 'lender' }),
    ]);

    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalDisbursed = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'completed', 'funded'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRepaid = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);

    const recentTransactions = await Transaction.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    const monthlyLoans = await Loan.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalLoans,
        totalBorrowers,
        totalLenders,
        loanStats,
        totalDisbursed: totalDisbursed[0]?.total || 0,
        totalRepaid: totalRepaid[0]?.total || 0,
        monthlyLoans,
        recentTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/admin/users
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (verified !== undefined) query.verified = verified === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', ...adminOnly, async (req, res) => {
  try {
    const { verified } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { verified }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Notification.create({
      user: user._id,
      title: verified ? 'Account Verified ✅' : 'Account Unverified',
      message: verified ? 'Your account has been verified by admin. You can now apply for loans.' : 'Your account verification has been revoked.',
      type: 'system',
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/admin/loans
router.get('/loans', ...adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = { $in: status.split(',') };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const loans = await Loan.find(query)
      .populate('borrower', 'name email creditScore verified phone')
      .populate('lender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(query);
    res.json({ success: true, loans, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/admin/loans/:id/approve
router.put('/loans/:id/approve', ...adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const loan = await Loan.findById(req.params.id).populate('borrower', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending loans can be approved' });
    }

    loan.status = 'approved';
    loan.approvedAt = new Date();
    loan.adminNote = adminNote || '';
    await loan.save();

    await Notification.create({
      user: loan.borrower._id,
      title: 'Loan Approved! 🎉',
      message: `Your loan application for ₹${loan.amount} has been approved by admin. It will be visible to lenders for funding.`,
      type: 'loan_approved',
      loan: loan._id,
    });

    res.json({ success: true, message: 'Loan approved', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/admin/loans/:id/reject
router.put('/loans/:id/reject', ...adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const loan = await Loan.findById(req.params.id).populate('borrower', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (!['pending', 'approved'].includes(loan.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reject this loan' });
    }

    loan.status = 'rejected';
    loan.adminNote = adminNote || 'Application does not meet requirements';
    await loan.save();

    // Update credit score negatively
    const borrower = await User.findById(loan.borrower._id);
    borrower.updateCreditScore(-5, 'Loan application rejected');
    await borrower.save();

    await Notification.create({
      user: loan.borrower._id,
      title: 'Loan Application Rejected',
      message: `Your loan application for ₹${loan.amount} has been rejected. Reason: ${loan.adminNote}`,
      type: 'loan_rejected',
      loan: loan._id,
    });

    res.json({ success: true, message: 'Loan rejected', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
