const path = require("path");
const dotenv = require("dotenv");

// Explicit path to root .env
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
