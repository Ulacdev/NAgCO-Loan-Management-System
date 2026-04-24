# NAgCO Loan Management System
### Napilihan Agriculture Cooperative

A modern, responsive, and secure Loan Management System built for the Napilihan Agriculture Cooperative. This system streamlines loan requests, approvals, and payment tracking for both administrators and cooperative members.

---

## 🚀 Tech Stack

### Frontend
- **React (Vite)**: High-performance frontend framework.
- **TypeScript**: Ensuring type safety and robust code.
- **Tailwind CSS**: Modern utility-first CSS framework for a premium, responsive UI.
- **Framer Motion**: Smooth, high-end animations and transitions.
- **Lucide React**: Elegant and consistent iconography.
- **CryptoJS**: Client-side hashing for secure password transmission.

### Backend
- **Node.js & Express**: Fast and scalable server-side environment.
- **TypeScript**: Maintaining consistency between frontend and backend.
- **Supabase (PostgreSQL)**: Enterprise-grade database with real-time capabilities.
- **Nodemailer**: Automated email notification system (OTP, approvals, notices).
- **Bcrypt**: Industrial-standard password hashing for database security.

---

## 🛠️ Key Tools & Services
- **Supabase Dashboard**: For managing the PostgreSQL database and authentication settings.
- **Gmail SMTP**: Powering the automated email communications via App Passwords.
- **Vercel**: The recommended platform for hosting the frontend and serverless functions.
- **SHA-256 & Bcrypt**: Dual-layer security for user credentials.

---

## 🏗️ System Architecture

### 1. Authentication Flow
- **Multi-Layer Security**: Passwords are hashed with SHA-256 on the client before being sent, then re-hashed with Bcrypt on the server.
- **2FA/OTP**: Login requires a 6-digit one-time password sent to the user's registered email.
- **Role-Based Access (RBAC)**: Distinct interfaces and permissions for `ADMIN` and `MEMBER` roles.

### 2. Loan Management
- **Request Flow**: Members can calculate and submit loan requests with specific types (APL, MPL, EHL, EPL).
- **Admin Approval**: Admins receive real-time notifications of new requests and can approve or reject them with a single click.
- **Automated Notifications**: Users are instantly notified via the dashboard and email when their loan status changes.

### 3. Financial Tracking
- **Payment Records**: Admins can record collections, which are immediately reflected in the member's history and the system's financial reports.
- **PDF Reporting**: Built-in functionality to generate professional financial summaries in PDF format.

### 4. Responsive UI
- **Mobile-First Design**: A "Facebook-style" mobile experience for authentication and dashboards.
- **Adaptive Layouts**: Tables and cards automatically hide non-essential data on small screens to maintain clarity.

---

## 📂 Project Structure
```bash
├── server/               # Node.js Backend
│   ├── src/
│   │   ├── routes/       # API Endpoints (Auth, Loans, Members, etc.)
│   │   ├── emailService.ts # Email notification logic
│   │   └── index.ts      # Server entry point
│   └── .env              # Backend environment variables
├── src/                  # React Frontend
│   ├── App.tsx           # Main Application logic & UI
│   ├── index.css         # Global styles & Tailwind config
├── vercel.json           # Hosting configuration
└── README.md             # Project documentation
```

---

## 🛡️ Security Best Practices
- **Service Role Bypass**: The backend uses Supabase Service Role keys to perform secure operations while keeping the database shielded from public access.
- **Input Sanitization**: All data sent to the server is validated and sanitized.
- **Cascading Deletes**: Database constraints ensure that deleting a user safely cleans up all related records (loans, payments, notifications).

---

© 2026 Napilihan Agriculture Cooperative System. All rights reserved.
