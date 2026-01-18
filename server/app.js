const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const loanRoutes = require("./routes/loanRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const creditRoutes = require("./routes/creditRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/credit", creditRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("MicroFund API is running");
});

module.exports = app;
