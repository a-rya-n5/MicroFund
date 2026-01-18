const express = require("express");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  applyForLoan,
  getMyLoans,
  approveLoan,
  getApprovedLoans,
} = require("../controllers/loanController");

const router = express.Router();

// Borrower
router.post("/apply", protect, allowRoles("borrower"), applyForLoan);
router.get("/my", protect, allowRoles("borrower"), getMyLoans);

// Admin
router.put("/:id/approve", protect, allowRoles("admin"), approveLoan);

// Lender
router.get("/available", protect, allowRoles("lender"), getApprovedLoans);

module.exports = router;
