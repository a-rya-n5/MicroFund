const express = require("express");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  fundLoan,
  payEmi,
} = require("../controllers/transactionController");

const router = express.Router();

// Lender funds loan
router.post(
  "/fund/:loanId",
  protect,
  allowRoles("lender"),
  fundLoan
);

// Borrower pays EMI
router.post(
  "/pay/:loanId",
  protect,
  allowRoles("borrower"),
  payEmi
);

module.exports = router;
