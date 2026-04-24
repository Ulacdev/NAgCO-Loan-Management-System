-- =============================================
-- NAgCO Loan Management System - Database Setup
-- Run this in your Supabase SQL Editor
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Inactive', 'Pending', 'Rejected')),
  phone TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('APL', 'MPL', 'EHL', 'EPL')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Active', 'Paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default admin account (password: admin)
INSERT INTO users (name, email, password, role, status)
VALUES ('System Admin', 'admin', 'admin', 'ADMIN', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Insert a default member account (password: member)
INSERT INTO users (name, email, password, role, status)
VALUES ('System Member', 'member', 'member', 'MEMBER', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (content, created_at)
VALUES 
  ('Cooperative meeting on Monday.', NOW()),
  ('Loan processing update.', NOW());

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (since we use service_role key on server)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON loans FOR ALL USING (true);
CREATE POLICY "Service role full access" ON payments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON announcements FOR ALL USING (true);
