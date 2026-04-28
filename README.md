# 🌾 NAgCO Loan Management System
### *A Simple Way to Handle Loans Online*

Welcome to the **NAgCO Loan Management System**! This is a website made to help the Napilihan Agriculture Cooperative (a local farming group) handle their loans without using too much paper or confusing spreadsheets. It works on both computers and phones.

---

## 🧐 Why did we build this?
Before, borrowing money meant filling out lots of paper forms and waiting a long time. This system makes it better by:
1. **Online Forms**: You can apply for a loan right on your phone.
2. **Easy Tracking**: No more asking "Is my loan ready?" — just check your account.
3. **Better Records**: The bosses (Admins) can see how much money is being borrowed with just one click.

---

## 🚀 How the System Works (Step-by-Step)

### 1. Getting In (Logging In Safely)
*   **Step 1: Sign Up**: New people sign up with their name and email.
*   **Step 2: Admin Check**: A boss (Admin) looks at your name and says "Yes" to activate your account.
*   **Step 3: Log In**: You enter your email and password.
*   **Step 4: Email Code (OTP)**: The system sends a 6-digit code to your email. You type that code in to get to your home page. This makes sure no one else can steal your account.

### 2. Borrowing Money (The Loan Process)
*   **Step 1: Calculator**: You use a tool on the screen to see how much you will pay back each month.
*   **Step 2: Apply**: You ask for a loan (like for an emergency or for your farm).
*   **Step 3: Review**: The boss (Admin) sees your request and clicks "Approve."
*   **Step 4: Done!**: You get your money. When you pay it back, the boss marks it as "Paid."

---

## 👥 Who uses it? (The Two Types of Accounts)

### 1. The Member (The Borrower)
*   **Home Page**: Sees how much money they borrowed and how much is left to pay.
*   **Calculator**: A tool to check the interest before asking for money.
*   **Loan History**: A list of all the loans they had in the past.
*   **Alerts**: Gets a message when their loan is approved.

### 2. The Admin (The Boss)
*   **Control Panel**: Sees a summary of all members and all the money given out.
*   **Member List**: Can add new members or remove old ones.
*   **Loan List**: Sees all the people asking for money and can say "Yes" or "No."
*   **Reports**: Can save a file (PDF) to show how the money is being used.

---

## 🔒 Safety (Keeping your data private)
Since this is about money, we make sure it is safe:
*   **Secret Passwords**: We don't save your actual password. We use a trick to scramble it so no one can read it.
*   **Email Codes**: Even if someone knows your password, they still need the code from your email to get in.
*   **Locked Pages**: Only the bosses can see the sensitive "Admin" pages.

---

## 🛠️ Tools We Used (The "Tech Stack")

If you want to know how we built this, here are the parts:

### The Part You See (Frontend)
*   **React**: This builds the pages and buttons you click.
*   **Tailwind**: This makes the website look pretty and clean.
*   **Framer Motion**: This makes the pages move smoothly when you click them.

### The Brain Behind the Screen (Backend)
*   **Node.js**: The main "brain" that handles all the data.
*   **Supabase**: The big storage box where we keep all the names, loans, and info.
*   **Nodemailer**: The tool that sends the automatic emails to you.

### Where it Lives Online (Deployment)
*   **Vercel**: The place where the website is hosted so you can visit it online.
*   **Gmail**: We use Gmail's system to send the login codes.

---
*Made for the Napilihan Agriculture Cooperative.*
