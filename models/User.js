const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['borrower', 'lender', 'admin'], default: 'borrower' },
    phone: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    wallet: { type: Number, default: 0, min: 0 },
    creditScore: { type: Number, default: 650, min: 300, max: 850 },
    creditHistory: [
      {
        date: { type: Date, default: Date.now },
        score: Number,
        reason: String,
        delta: Number,
      },
    ],
    totalBorrowed: { type: Number, default: 0 },
    totalRepaid: { type: Number, default: 0 },
    totalFunded: { type: Number, default: 0 },
    totalReturns: { type: Number, default: 0 },
    activeLoansCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Update credit score
UserSchema.methods.updateCreditScore = function (delta, reason) {
  const newScore = Math.max(300, Math.min(850, this.creditScore + delta));
  this.creditHistory.push({
    date: new Date(),
    score: newScore,
    reason,
    delta,
  });
  this.creditScore = newScore;
};

module.exports = mongoose.model('User', UserSchema);
