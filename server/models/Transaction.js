const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["FUND_LOAN", "EMI_PAYMENT", "WALLET_TOPUP"],
      required: true,
    },

    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
