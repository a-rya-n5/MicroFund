# ⚡ MicroFund — Smart Micro-Lending Platform

A full-stack micro-lending web application connecting borrowers and lenders through a secure, transparent system.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ ([Download](https://nodejs.org))
- **MongoDB** v5+ running locally ([Download](https://www.mongodb.com/try/download/community)) OR use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env` and update if needed:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/microfund
JWT_SECRET=microfund_super_secret_jwt_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGO_URI` with your connection string:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/microfund
```

### 3. Start the Server
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

### 4. Open Browser
```
http://localhost:5000
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mf.com | admin123 |
| Borrower | borrower@mf.com | demo123 |
| Lender | lender@mf.com | demo123 |

> All demo accounts are auto-created on first startup.

---

## 🎯 Platform Workflow

```
Borrower Applies → Admin Reviews → Admin Approves → Lender Funds → Borrower Repays EMIs → Loan Complete
```

### Step-by-Step Demo:
1. **Login as Borrower** → Apply for a loan (e.g., ₹25,000 @ 12% for 12 months)
2. **Login as Admin** → Review and approve the loan application
3. **Login as Lender** → Browse approved loans and fund one
4. **Login as Borrower** → View EMI schedule and pay monthly installments
5. **Both parties** receive real-time wallet updates and notifications

---

## ✨ Features

### 🔐 Authentication
- JWT-based login/registration with role-based access (borrower / lender / admin)
- Secure password hashing with bcrypt
- Token-based session management

### 💳 Live Wallets
- Real-time balance updates on every transaction
- Wallet top-up (demo), loan disbursement, EMI collection
- Full transaction history with credit/debit tracking

### 📅 EMI System
- Compound interest formula: `EMI = P × r × (1+r)^n / ((1+r)^n - 1)`
- Full amortization schedule with principal/interest breakdown
- Payment enforcement (must pay in order)
- EMI Calculator accessible from any page (🧮 button in topbar)

### ⭐ Credit Score Engine
- Starts at 650 for new borrowers
- Updates automatically after each repayment (+5 on-time, +3 late, +20 completion)
- Visual gauge with history log
- Demo simulator to test score impacts

### 🔔 Notifications
- Borrowers notified on: loan approved/rejected, loan funded, EMI reminders
- Lenders notified on: EMI received, loan completion
- Admins notified on: new loan applications
- Auto-polling every 30 seconds

### 🌙 Dark/Light Mode
- Persists across sessions via localStorage

### 👨‍💼 Admin Panel
- Review and approve/reject loan applications with notes
- Verify/unverify user accounts
- View all platform statistics

---

## 📁 Project Structure

```
microfund/
├── server.js              # Express app entry point
├── .env                   # Environment variables
├── package.json
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT verification middleware
├── models/
│   ├── User.js            # User schema (wallet, credit score)
│   ├── Loan.js            # Loan schema (EMI schedule, status)
│   ├── Transaction.js     # Transaction history
│   └── Notification.js    # Notification model
├── routes/
│   ├── auth.js            # Login, register, me
│   ├── loans.js           # Loan CRUD, fund, repay
│   ├── users.js           # Wallet, transactions, notifications
│   └── admin.js           # Admin controls
└── public/                # Frontend (served statically)
    ├── index.html         # Login/Register page
    ├── dashboard.html     # Role-specific dashboard
    ├── loans.html         # Loan management
    ├── wallet.html        # Wallet & transactions
    ├── admin.html         # Admin panel
    ├── credit.html        # Credit score (borrower)
    ├── css/
    │   └── style.css      # Complete design system
    └── js/
        ├── common.js      # API helper, Auth, Toast, Format, EMI calc
        └── layout.js      # Layout HTML generators
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List loans (role-filtered) |
| POST | `/api/loans` | Apply for loan (borrower) |
| GET | `/api/loans/:id` | Get loan details |
| GET | `/api/loans/:id/schedule` | Get EMI schedule |
| POST | `/api/loans/:id/fund` | Fund a loan (lender) |
| POST | `/api/loans/:id/repay` | Pay next EMI (borrower) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/wallet` | Get wallet balance |
| POST | `/api/users/wallet/topup` | Add funds |
| GET | `/api/users/transactions` | Transaction history |
| GET | `/api/users/notifications` | Get notifications |
| PUT | `/api/users/notifications/:id/read` | Mark read |
| PUT | `/api/users/notifications/read-all/mark` | Mark all read |
| GET | `/api/users/credit-score` | Credit score + history |
| POST | `/api/users/credit-simulate` | Simulate score change |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/verify` | Verify user |
| GET | `/api/admin/loans` | All loans |
| PUT | `/api/admin/loans/:id/approve` | Approve loan |
| PUT | `/api/admin/loans/:id/reject` | Reject loan |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (no framework) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Design | Custom CSS Design System + Google Fonts |

---

## 📝 Notes

- All amounts are in Indian Rupees (₹)
- Lenders start with ₹50,000 wallet balance on registration (demo)
- Credit scores range from 300 (poor) to 850 (exceptional)
- Maximum loan: ₹5,00,000 at up to 50% annual interest
- EMI schedules use the standard reducing balance method
