const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    type: {
      type: String,
      enum: ['topup', 'loan_funded', 'loan_received', 'emi_paid', 'emi_received', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['credit', 'debit'], required: true },
    balanceBefore: Number,
    balanceAfter: Number,
    description: { type: String, required: true },
    reference: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
