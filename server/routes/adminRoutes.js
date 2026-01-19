const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const User = require("../models/User");
const Loan = require("../models/Loan");

router.get("/stats", protect, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: "FUNDED" });
    const pendingLoans = await Loan.countDocuments({ status: "APPROVED" });

    const loans = await Loan.find({ status: "FUNDED" });
    const capital = loans.reduce((sum, l) => sum + l.amount, 0);

    res.json({
      users,
      activeLoans,
      pendingLoans,
      capital
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
