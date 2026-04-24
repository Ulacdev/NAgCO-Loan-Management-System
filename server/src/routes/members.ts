import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcrypt';

const router = Router();

// GET /api/members — list all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: members, error } = await supabase
      .from('users')
      .select('id, name, username, email, role, status, phone, profile_image, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch members error:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
      return;
    }

    res.json({ members });
  } catch (err) {
    console.error('Members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/members/:id/role — update a member's role
router.put('/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'MEMBER'].includes(role.toUpperCase())) {
      res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role: role.toUpperCase() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role' });
      return;
    }

    const { password: _, ...safeUser } = data;
    res.json({ user: safeUser, message: 'Role updated successfully' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/members/:id — delete a member
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete member error:', error);
      res.status(500).json({ error: 'Failed to delete member' });
      return;
    }

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/members/:id/status — approve or reject a member
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Rejected', 'Inactive'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const { data: member, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
      return;
    }

    // Send Notifications
    const { sendApprovalEmail, sendRejectionEmail } = require('../emailService');
    if (status === 'Active') {
      await sendApprovalEmail(member.email, member.name);
      await supabase.from('notifications').insert({
        user_id: member.id,
        title: 'Account Approved! 🎉',
        message: 'Your registration has been approved. You can now access all features.',
        type: 'ACCOUNT_APPROVAL'
      });
    } else if (status === 'Rejected') {
      await sendRejectionEmail(member.email, member.name);
      await supabase.from('notifications').insert({
        user_id: member.id,
        title: 'Registration Rejected ❌',
        message: 'Your account registration was not approved. Please contact office for info.',
        type: 'ACCOUNT_REJECTION'
      });
    }

    const { password: _, ...safeUser } = member;
    res.json({ user: safeUser, message: `Member status updated to ${status}` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/members/:id/profile — update own profile
router.put('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, profile_image } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profile_image) updateData.profile_image = profile_image;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    const { password: _, ...safeUser } = data;
    res.json({ user: safeUser, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/members/:id/password — update own password
router.put('/:id/password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      res.status(401).json({ error: 'Incorrect current password' });
      return;
    }

    let isPasswordValid = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      const crypto = require('crypto');
      const dbPasswordSha256 = crypto.createHash('sha256').update(user.password).digest('hex');
      isPasswordValid = (dbPasswordSha256 === currentPassword);
    }

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Incorrect current password' });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (updateError) {
      console.error('Update password error:', updateError);
      res.status(500).json({ error: 'Failed to update password' });
      return;
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
