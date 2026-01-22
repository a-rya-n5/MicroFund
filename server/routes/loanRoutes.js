const express = require("express");
const Loan = require("../models/Loan");
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
// Admin – pending loans
router.get(
  "/pending",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const loans = await Loan.find({ status: "PENDING" })
        .populate("borrower", "name creditScore");

      res.json(loans);
    } catch (err) {
      console.error("PENDING LOANS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch pending loans" });
    }
  }
);

// Lender
router.get("/available", protect, allowRoles("lender"), getApprovedLoans);

module.exports = router;
