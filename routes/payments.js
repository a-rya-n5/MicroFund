const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create an order (called when user clicks "Pay")
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay uses paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: `wu_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: req.user._id.toString(),
        purpose: 'wallet_topup',
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// Step 2: Verify payment signature & credit wallet
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // Verify the payment signature (HMAC SHA256)
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    // Signature valid — credit the wallet
    const amountInRupees = Math.round(amount / 100);
    const user = await User.findById(req.user._id);

    const balanceBefore = user.wallet;
    user.wallet += amountInRupees;
    await user.save();

    // Record transaction
    await Transaction.create({
      user: user._id,
      type: 'topup',
      direction: 'credit',
      amount: amountInRupees,
      description: `Wallet top-up via UPI (Razorpay)`,
      reference: razorpay_payment_id,
      balanceBefore,
      balanceAfter: user.wallet,
    });

    res.json({
      success: true,
      message: `₹${amountInRupees} added to your wallet via UPI`,
      newBalance: user.wallet,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;