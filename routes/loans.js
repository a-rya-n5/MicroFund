const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Helper: create transaction record
const createTransaction = async (userId, type, amount, direction, description, loanId, balanceBefore, balanceAfter, meta) => {
  return Transaction.create({
    user: userId,
    loan: loanId,
    type,
    amount,
    direction,
    description,
    balanceBefore,
    balanceAfter,
    reference: `TXN${Date.now()}`,
    meta,
  });
};

// Helper: create notification
const notify = async (userId, title, message, type, loanId) => {
  return Notification.create({ user: userId, title, message, type, loan: loanId });
};

// @route GET /api/loans
// Borrower sees own loans, Lender sees funded loans + approved (available), Admin sees all
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (req.user.role === 'borrower') {
      query.borrower = req.user._id;
    } else if (req.user.role === 'lender') {
      const statusFilter = status ? status.split(',') : ['approved', 'funded', 'active', 'completed'];
      query.status = { $in: statusFilter };
    } else {
      // admin: all
      if (status) query.status = { $in: status.split(',') };
    }

    if (status && req.user.role === 'borrower') {
      query.status = { $in: status.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const loans = await Loan.find(query)
      .populate('borrower', 'name email creditScore verified')
      .populate('lender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(query);

    res.json({ success: true, count: loans.length, total, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/loans — Borrower applies
router.post('/', protect, authorize('borrower'), async (req, res) => {
  try {
    const { amount, interestRate, tenure, purpose, description } = req.body;

    if (!amount || !interestRate || !tenure || !purpose) {
      return res.status(400).json({ success: false, message: 'Please provide amount, interestRate, tenure, and purpose' });
    }

    if (!req.user.verified) {
      return res.status(403).json({ success: false, message: 'Your account must be verified to apply for loans' });
    }

    // Check for existing active applications
    const activeApp = await Loan.findOne({
      borrower: req.user._id,
      status: { $in: ['pending', 'approved', 'funded', 'active'] },
    });

    if (activeApp && activeApp.status === 'pending') {
      return res.status(400).json({ success: false, message: 'You already have a pending loan application' });
    }

    // Determine risk score based on credit score
    let riskScore = 'medium';
    if (req.user.creditScore >= 750) riskScore = 'low';
    else if (req.user.creditScore < 600) riskScore = 'high';

    const loan = new Loan({
      borrower: req.user._id,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      tenure: parseInt(tenure),
      purpose,
      description,
      riskScore,
    });

    loan.calculateEMI();
    await loan.save();

    // Notify admin (we'll use a general approach)
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notify(admin._id, 'New Loan Application', `${req.user.name} applied for ₹${amount} loan for "${purpose}"`, 'loan_applied', loan._id);
    }

    await notify(req.user._id, 'Loan Application Submitted', `Your loan application for ₹${amount} has been submitted and is pending admin review.`, 'loan_applied', loan._id);

    const populated = await loan.populate('borrower', 'name email creditScore');
    res.status(201).json({ success: true, loan: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/loans/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower', 'name email creditScore phone verified')
      .populate('lender', 'name email');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    // Access control
    if (req.user.role === 'borrower' && loan.borrower._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/loans/:id/schedule
router.get('/:id/schedule', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrower', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (req.user.role === 'borrower' && loan.borrower._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, schedule: loan.schedule, loan: { amount: loan.amount, emi: loan.emi, totalPayable: loan.totalPayable, totalInterest: loan.totalInterest, paidAmount: loan.paidAmount, remainingAmount: loan.remainingAmount, status: loan.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/loans/:id/fund — Lender funds a loan
router.post('/:id/fund', protect, authorize('lender'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrower', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Loan must be approved before funding' });
    }

    const lender = await User.findById(req.user._id);
    if (lender.wallet < loan.amount) {
      return res.status(400).json({ success: false, message: `Insufficient wallet balance. You need ₹${loan.amount} but have ₹${lender.wallet}` });
    }

    const borrower = await User.findById(loan.borrower._id);

    // Deduct from lender
    const lenderBalBefore = lender.wallet;
    lender.wallet -= loan.amount;
    lender.totalFunded += loan.amount;
    await lender.save();

    // Credit to borrower
    const borrowerBalBefore = borrower.wallet;
    borrower.wallet += loan.amount;
    borrower.totalBorrowed += loan.amount;
    borrower.activeLoansCount += 1;
    await borrower.save();

    // Update loan
    loan.lender = lender._id;
    loan.status = 'active';
    loan.fundedAt = new Date();
    loan.generateSchedule(new Date());
    await loan.save();

    // Transactions
    await createTransaction(lender._id, 'loan_funded', loan.amount, 'debit', `Funded loan #${loan._id.toString().slice(-6).toUpperCase()} for ${borrower.name}`, loan._id, lenderBalBefore, lender.wallet);
    await createTransaction(borrower._id, 'loan_received', loan.amount, 'credit', `Loan disbursed from ${lender.name}`, loan._id, borrowerBalBefore, borrower.wallet);

    // Notifications
    await notify(lender._id, 'Loan Funded Successfully', `You funded ₹${loan.amount} loan for ${borrower.name}. You will receive ₹${loan.totalPayable} back.`, 'loan_funded', loan._id);
    await notify(borrower._id, 'Loan Disbursed!', `₹${loan.amount} has been credited to your wallet by ${lender.name}. First EMI of ₹${loan.emi} is due on ${loan.schedule[0]?.dueDate?.toDateString()}.`, 'loan_funded', loan._id);

    res.json({ success: true, message: 'Loan funded successfully', loan: await loan.populate('lender', 'name email') });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/loans/:id/repay — Borrower pays next EMI
router.post('/:id/repay', protect, authorize('borrower'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('lender');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.borrower.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (loan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Loan is not active' });
    }

    // Find next pending EMI
    const nextEMI = loan.schedule.find((e) => e.status === 'pending');
    if (!nextEMI) {
      return res.status(400).json({ success: false, message: 'All EMIs have been paid' });
    }

    const borrower = await User.findById(req.user._id);
    if (borrower.wallet < nextEMI.amount) {
      return res.status(400).json({ success: false, message: `Insufficient wallet balance. EMI amount is ₹${nextEMI.amount}` });
    }

    // Check if overdue
    const isLate = new Date() > new Date(nextEMI.dueDate);

    // Deduct from borrower
    const borrowerBalBefore = borrower.wallet;
    borrower.wallet -= nextEMI.amount;
    borrower.totalRepaid += nextEMI.amount;
    await borrower.save();

    // Credit to lender
    const lender = await User.findById(loan.lender._id);
    const lenderBalBefore = lender.wallet;
    lender.wallet += nextEMI.amount;
    lender.totalReturns += nextEMI.amount;
    await lender.save();

    // Mark EMI paid
    nextEMI.status = 'paid';
    nextEMI.paidAt = new Date();
    nextEMI.paidAmount = nextEMI.amount;

    loan.paidAmount += nextEMI.amount;
    loan.remainingAmount = Math.max(0, loan.totalPayable - loan.paidAmount);

    // Check completion
    const allPaid = loan.schedule.every((e) => e.status === 'paid');
    if (allPaid) {
      loan.status = 'completed';
      loan.completedAt = new Date();
      borrower.activeLoansCount = Math.max(0, borrower.activeLoansCount - 1);
      await borrower.save();
      await notify(borrower._id, 'Loan Fully Repaid! 🎉', `Congratulations! You've fully repaid your ₹${loan.amount} loan. Your credit score will improve.`, 'emi_paid', loan._id);
      await notify(lender._id, 'Loan Repaid Fully', `The loan of ₹${loan.amount} you funded has been fully repaid. Total received: ₹${loan.totalPayable}.`, 'emi_received', loan._id);
    }

    await loan.save();

    // Update credit score
    const scoreDelta = isLate ? 3 : 5;
    borrower.updateCreditScore(scoreDelta, isLate ? 'EMI paid (late)' : 'EMI paid on time');
    await borrower.save();

    // Transactions
    await createTransaction(borrower._id, 'emi_paid', nextEMI.amount, 'debit', `EMI #${nextEMI.installmentNo} paid for loan #${loan._id.toString().slice(-6).toUpperCase()}`, loan._id, borrowerBalBefore, borrower.wallet, { installmentNo: nextEMI.installmentNo });
    await createTransaction(lender._id, 'emi_received', nextEMI.amount, 'credit', `EMI #${nextEMI.installmentNo} received from ${borrower.name}`, loan._id, lenderBalBefore, lender.wallet, { installmentNo: nextEMI.installmentNo });

    // Notify
    await notify(borrower._id, `EMI #${nextEMI.installmentNo} Paid`, `Your EMI of ₹${nextEMI.amount} has been paid. Credit score +${scoreDelta}.`, 'emi_paid', loan._id);
    await notify(lender._id, `EMI Received from ${borrower.name}`, `₹${nextEMI.amount} received as EMI #${nextEMI.installmentNo}.`, 'emi_received', loan._id);

    res.json({
      success: true,
      message: allPaid ? 'Loan fully repaid! Congratulations!' : `EMI #${nextEMI.installmentNo} paid successfully`,
      emi: nextEMI,
      newBalance: borrower.wallet,
      newCreditScore: borrower.creditScore,
      loanStatus: loan.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
