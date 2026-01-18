const Loan = require("../models/Loan");
const { calculateEMI } = require("../services/emiService");

/**
 * @desc Borrower applies for loan
 * @route POST /api/loans/apply
 * @access Borrower
 */
exports.applyForLoan = async (req, res) => {
  try {
    const { amount, interestRate, tenure } = req.body;

    if (!amount || !interestRate || !tenure) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emi = calculateEMI(amount, interestRate, tenure);

    const loan = await Loan.create({
      borrower: req.user._id,
      amount,
      interestRate,
      tenure,
      emi,
    });

    res.status(201).json({
      message: "Loan application submitted",
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get borrower loans
 * @route GET /api/loans/my
 * @access Borrower
 */
exports.getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ borrower: req.user._id });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Admin approves loan
 * @route PUT /api/loans/:id/approve
 * @access Admin
 */
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    loan.status = "APPROVED";
    await loan.save();

    res.json({ message: "Loan approved", loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc View approved loans (Lenders)
 * @route GET /api/loans/available
 * @access Lender
 */
exports.getApprovedLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: "APPROVED" }).populate(
      "borrower",
      "name creditScore"
    );
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
