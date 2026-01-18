const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getMyCreditScore } = require("../controllers/creditController");

const router = express.Router();

router.get("/me", protect, getMyCreditScore);

module.exports = router;
