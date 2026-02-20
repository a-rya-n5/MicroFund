const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['loan_applied', 'loan_approved', 'loan_rejected', 'loan_funded', 'emi_due', 'emi_paid', 'emi_received', 'topup', 'credit_score', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    link: String,
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
