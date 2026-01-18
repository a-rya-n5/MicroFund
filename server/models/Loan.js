const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1000,
    },

    interestRate: {
      type: Number,
      required: true, // annual %
    },

    tenure: {
      type: Number,
      required: true, // months
    },

    emi: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "FUNDED", "COMPLETED"],
      default: "PENDING",
    },

    fundedAmount: {
      type: Number,
      default: 0,
    },

    lenders: [
      {
        lender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Loan", loanSchema);
