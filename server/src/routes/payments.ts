import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';

const router = Router();

// GET /api/payments — get all payments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Fetch payments error:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
      return;
    }

    res.json({ payments: data });
  } catch (err) {
    console.error('Payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments — record a new payment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { member_id, member_name, loan_type, amount, date } = req.body;

    if (!member_id || !amount) {
      res.status(400).json({ error: 'Missing payment data' });
      return;
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id,
        member_name,
        loan_type,
        amount,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      console.error('Record payment error:', error);
      res.status(500).json({ error: 'Failed to record payment' });
      return;
    }

    res.status(201).json({ payment: data, message: 'Payment recorded successfully' });
  } catch (err) {
    console.error('Record payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
