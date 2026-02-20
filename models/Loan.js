const mongoose = require('mongoose');

const EMISchema = new mongoose.Schema({
  installmentNo: Number,
  dueDate: Date,
  amount: Number,
  principal: Number,
  interest: Number,
  balance: Number,
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  paidAt: Date,
  paidAmount: Number,
});

const LoanSchema = new mongoose.Schema(
  {
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: [true, 'Loan amount is required'], min: 100, max: 500000 },
    interestRate: { type: Number, required: true, min: 1, max: 50 }, // annual %
    tenure: { type: Number, required: true, min: 1, max: 60 }, // months
    purpose: { type: String, required: [true, 'Purpose is required'], trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'funded', 'active', 'completed', 'defaulted'],
      default: 'pending',
    },
    emi: Number,
    totalPayable: Number,
    totalInterest: Number,
    paidAmount: { type: Number, default: 0 },
    remainingAmount: Number,
    schedule: [EMISchema],
    currentEMIIndex: { type: Number, default: 0 },
    approvedAt: Date,
    fundedAt: Date,
    completedAt: Date,
    adminNote: String,
    riskScore: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { timestamps: true }
);

// Calculate EMI using compound interest formula
LoanSchema.methods.calculateEMI = function () {
  const P = this.amount;
  const r = this.interestRate / 12 / 100; // monthly rate
  const n = this.tenure;

  let emi;
  if (r === 0) {
    emi = P / n;
  } else {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  this.emi = Math.round(emi * 100) / 100;
  this.totalPayable = Math.round(emi * n * 100) / 100;
  this.totalInterest = Math.round((this.totalPayable - P) * 100) / 100;
  this.remainingAmount = this.totalPayable;
  return this.emi;
};

// Generate amortization schedule
LoanSchema.methods.generateSchedule = function (startDate) {
  const P = this.amount;
  const r = this.interestRate / 12 / 100;
  const n = this.tenure;
  const emi = this.emi;

  let balance = P;
  this.schedule = [];

  for (let i = 1; i <= n; i++) {
    const interest = Math.round(balance * r * 100) / 100;
    const principal = Math.round((emi - interest) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principal) * 100) / 100);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    this.schedule.push({
      installmentNo: i,
      dueDate,
      amount: emi,
      principal,
      interest,
      balance,
      status: 'pending',
    });
  }
  // Fix last EMI for rounding
  if (this.schedule.length > 0) {
    const last = this.schedule[this.schedule.length - 1];
    last.balance = 0;
  }
};

LoanSchema.virtual('progress').get(function () {
  if (!this.totalPayable) return 0;
  return Math.round((this.paidAmount / this.totalPayable) * 100);
});

module.exports = mongoose.model('Loan', LoanSchema);
