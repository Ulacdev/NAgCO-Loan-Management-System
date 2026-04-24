import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcrypt';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Look up user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Password check
    let isPasswordValid = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      const crypto = require('crypto');
      const dbPasswordSha256 = crypto.createHash('sha256').update(user.password).digest('hex');
      isPasswordValid = (dbPasswordSha256 === password);
    }

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check status
    if (user.status === 'Pending') {
      res.status(403).json({ error: 'Your account is pending approval. Please wait for an administrator to approve your registration.' });
      return;
    }

    if (user.status === 'Inactive' || user.status === 'Rejected') {
      res.status(403).json({ error: 'Your account is disabled or rejected. Please contact support.' });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 600000).toISOString(); // 10 minutes

    // Save OTP to DB
    const { error: otpError } = await supabase
      .from('users')
      .update({ otp_code: otp, otp_expiry: otpExpiry })
      .eq('id', user.id);

    if (otpError) {
      console.error('OTP Save Error:', otpError);
      res.status(500).json({ error: 'Failed to generate security code' });
      return;
    }

    // Send OTP Email
    const { sendOTPEmail } = require('../emailService');
    await sendOTPEmail(user.email, user.name, otp);

    res.json({ requires_otp: true, email: user.email, message: 'Security code sent to your email.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and security code are required' });
      return;
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Check OTP
    if (user.otp_code !== otp) {
      res.status(401).json({ error: 'Invalid security code' });
      return;
    }

    // Check expiry
    if (new Date(user.otp_expiry) < new Date()) {
      res.status(401).json({ error: 'Security code has expired' });
      return;
    }

    // Clear OTP and complete login
    await supabase
      .from('users')
      .update({ otp_code: null, otp_expiry: null })
      .eq('id', user.id);

    const { password: _, otp_code: __, otp_expiry: ___, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('OTP Verify Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with Pending status
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        username: username || null,
        email,
        password: hashedPassword,
        role: 'MEMBER',
        status: 'Pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to create account' });
      return;
    }

    // Notify Admin via Email
    const { sendNewRegistrationEmail } = require('../emailService');
    await sendNewRegistrationEmail(name, email);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, message: 'Account request submitted for approval.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const crypto = require('crypto');

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.json({ message: 'If an account exists with this email, you will receive a reset link shortly.' });
      return;
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    // Save token to DB
    await supabase
      .from('users')
      .update({ 
        reset_token: token, 
        reset_token_expiry: expiry 
      })
      .eq('id', user.id);

    // Send email with link
    const { sendResetLinkEmail } = require('../emailService');
    await sendResetLinkEmail(user.email, user.name, token);

    res.json({ message: 'Password reset link sent successfully.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    // Find user with valid token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (error || !user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Check expiry
    if (new Date(user.reset_token_expiry) < new Date()) {
      res.status(400).json({ error: 'Reset token has expired' });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear token
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null 
      })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({ error: 'Failed to update password' });
      return;
    }

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
