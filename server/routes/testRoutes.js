const express = require("express");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Borrower-only route
router.get(
  "/borrower",
  protect,
  allowRoles("borrower"),
  (req, res) => {
    res.json({ message: "Borrower access granted" });
  }
);

// Lender-only route
router.get(
  "/lender",
  protect,
  allowRoles("lender"),
  (req, res) => {
    res.json({ message: "Lender access granted" });
  }
);

// Admin-only route
router.get(
  "/admin",
  protect,
  allowRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

module.exports = router;
