const User = require("../models/User");

/**
 * @desc Get logged-in user's credit score
 * @route GET /api/credit/me
 * @access Protected
 */
exports.getMyCreditScore = async (req, res) => {
  res.json({
    creditScore: req.user.creditScore,
  });
};
