const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
    debitWallet,
    creditWallet,
} = require("../services/walletService");
const { updateCreditScore } = require("../services/creditScoreService");

/**
 * @desc Lender funds a loan
 */
exports.fundLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findById(req.params.loanId);
    console.log("DEBUG LOAN STATUS:", JSON.stringify(loan.status));

    if (!loan || loan.status !== "APPROVED") {
      return res
        .status(400)
        .json({ message: "Loan not available for funding" });
    }

    // Debit lender wallet
    await debitWallet(req.user._id, amount);

    // Update loan
    loan.fundedAmount += amount;
    loan.lenders.push({ lender: req.user._id, amount });

    // If fully funded → disburse to borrower
    if (loan.fundedAmount >= loan.amount) {
      loan.status = "FUNDED";

      // 🔴 THIS LINE IS CRITICAL
      await creditWallet(loan.borrower, loan.amount);
    }

    await loan.save();

    await Transaction.create({
      from: req.user._id,
      to: loan.borrower,
      amount,
      type: "FUND_LOAN",
      loan: loan._id,
    });

    res.json({ message: "Loan funded successfully", loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Borrower pays EMI + credit score update
 */
exports.payEmi = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.loanId).populate("borrower");

        if (!loan || loan.status !== "FUNDED") {
            return res.status(400).json({ message: "Loan not active" });
        }

        // Debit borrower
        await debitWallet(loan.borrower._id, loan.emi);

        // Credit lenders
        const splitAmount = loan.emi / loan.lenders.length;
        for (const lender of loan.lenders) {
            await creditWallet(lender.lender, splitAmount);
        }

        // Update borrower credit score
        loan.borrower.creditScore = updateCreditScore(
            loan.borrower.creditScore,
            "EMI_PAID"
        );
        await loan.borrower.save();

        await Transaction.create({
            from: loan.borrower._id,
            amount: loan.emi,
            type: "EMI_PAYMENT",
            loan: loan._id,
        });

        res.json({
            message: "EMI payment successful",
            updatedCreditScore: loan.borrower.creditScore,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
