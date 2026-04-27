import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { sendLoanRequestEmail, sendLoanStatusUpdateEmail, sendLoanRequestConfirmationEmail } from '../emailService';

const router = Router();

// GET /api/loans — get all loans (recent first)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch loans error:', error);
      res.status(500).json({ error: 'Failed to fetch loans' });
      return;
    }

    res.json({ loans: data });
  } catch (err) {
    console.error('Loans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/loans — create a new loan request
router.post('/', async (req: Request, res: Response) => {
  try {
    const { member_id, member_name, type, amount } = req.body;

    if (!member_id || !type || !amount) {
      res.status(400).json({ error: 'Missing required loan fields' });
      return;
    }

    const { data, error } = await supabase
      .from('loans')
      .insert({
        member_id,
        member_name,
        type,
        amount,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Create loan error:', error);
      res.status(500).json({ error: 'Failed to submit loan request' });
      return;
    }

    // Notify Admins
    const { data: admins } = await supabase.from('users').select('id, email').eq('role', 'ADMIN');
    if (admins) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: 'New Loan Request',
          message: `${member_name} requested ₱ ${amount.toLocaleString()} for ${type}`,
          type: 'LOAN_REQUEST'
        });
      }
      // Send one email to the system admin address
      await sendLoanRequestEmail(member_name, type, amount);
    }

    // Send Confirmation Email to Member
    const { data: member } = await supabase
      .from('users')
      .select('email')
      .eq('id', member_id)
      .single();

    if (member && member.email) {
      await sendLoanRequestConfirmationEmail(member.email, member_name, type, amount);
    }

    // Notify Member (In-app)
    await supabase.from('notifications').insert({
      user_id: member_id,
      title: 'Loan Application Submitted',
      message: `Your request for ${type} (₱ ${amount.toLocaleString()}) has been received and is now Pending.`,
      type: 'LOAN_REQUEST'
    });

    res.status(201).json({ loan: data, message: 'Loan request submitted successfully' });
  } catch (err) {
    console.error('Create loan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/loans/:id/status — approve or reject a loan
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid loan status' });
      return;
    }

    const { data, error } = await supabase
      .from('loans')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update loan error:', error);
      res.status(500).json({ error: 'Failed to update loan status' });
      return;
    }

    // Notify Member
    await supabase.from('notifications').insert({
      user_id: data.member_id,
      title: status === 'Active' ? 'Loan Approved! 🎉' : 'Loan Rejected ❌',
      message: status === 'Active' 
        ? `Your request for ${data.type} (₱ ${data.amount.toLocaleString()}) has been approved.`
        : `Your request for ${data.type} (₱ ${data.amount.toLocaleString()}) was rejected.`,
      type: 'LOAN_STATUS'
    });

    // Send Email to Member
    const { data: member } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', data.member_id)
      .single();

    if (member && member.email) {
      await sendLoanStatusUpdateEmail(member.email, member.name, data.type, data.amount, status);
    }

    res.json({ loan: data, message: `Loan status updated to ${status}` });
  } catch (err) {
    console.error('Update loan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
