require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Notification = require('./models/Notification');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files — served BEFORE DB connection so login page always works
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
// After your existing routes
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'MicroFund API running',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// API 404 handler (prevents hanging for unknown API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Serve frontend for any non-API route (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Seed admin user on startup
const seedAdmin = async () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Skipping seed — MongoDB not connected');
      return;
    }

    const admin = await User.findOne({ email: 'admin@mf.com' });
    if (!admin) {
      await User.create({
        name: 'MicroFund Admin', email: 'admin@mf.com', password: 'admin123',
        role: 'admin', verified: true, wallet: 999999, creditScore: 850,
      });
      console.log('✅ Admin user created: admin@mf.com / admin123');
    } else {
      console.log('ℹ️  Demo accounts already exist');
    }

    const demoB = await User.findOne({ email: 'borrower@mf.com' });
    if (!demoB) {
      const b = await User.create({
        name: 'Priya Sharma', email: 'borrower@mf.com', password: 'demo123',
        role: 'borrower', verified: true, wallet: 5000, creditScore: 720, phone: '+91 98765 43210',
      });
      await Notification.create({ user: b._id, title: 'Welcome to MicroFund!', message: 'Demo borrower account ready. Apply for your first loan!', type: 'system' });
      console.log('✅ Demo borrower created: borrower@mf.com / demo123');
    }

    const demoL = await User.findOne({ email: 'lender@mf.com' });
    if (!demoL) {
      const l = await User.create({
        name: 'Rahul Kapoor', email: 'lender@mf.com', password: 'demo123',
        role: 'lender', verified: true, wallet: 150000, creditScore: 780, phone: '+91 87654 32109',
      });
      await Notification.create({ user: l._id, title: 'Welcome to MicroFund!', message: 'Demo lender account ready with ₹1,50,000. Start funding loans!', type: 'system' });
      console.log('✅ Demo lender created: lender@mf.com / demo123');
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 MicroFund server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Connect to DB AFTER server is already listening (so static files always work)
  const connected = await connectDB();
  if (connected) {
    await seedAdmin();
    console.log('\n📝 Demo Accounts:');
    console.log('   Admin:    admin@mf.com    / admin123');
    console.log('   Borrower: borrower@mf.com / demo123');
    console.log('   Lender:   lender@mf.com   / demo123\n');
  } else {
    console.log('\n⚠️  MongoDB not connected. Start MongoDB to use the API.');
    console.log('   Install: https://www.mongodb.com/try/download/community');
    console.log('   Start:   mongod --dbpath /data/db\n');
  }
});

module.exports = app;
