import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';

import { sendAnnouncementEmail } from '../emailService';

const router = Router();

// GET /api/announcements — get all announcements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch announcements error:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
      return;
    }

    res.json({ announcements: data });
  } catch (err) {
    console.error('Announcements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/announcements — create new announcement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, title, start_date, end_date } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        content,
        title: title || 'System Update',
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
      return;
    }

    // Notify all users via email & in-app (Async)
    const { data: users, error: userError } = await supabase.from('users').select('id, email');
    if (!userError && users) {
      // Send emails in the background
      users.forEach(u => {
        if (u.email && u.email.includes('@')) {
          sendAnnouncementEmail(u.email, title || 'System Update', content);
        }
        // In-app notification
        supabase.from('notifications').insert({
          user_id: u.id,
          title: `📢 ${title || 'System Update'}`,
          message: content.substring(0, 100),
          type: 'ANNOUNCEMENT'
        }).then(); // fire and forget
      });
    }

    res.status(201).json({ announcement: data, message: 'Announcement posted successfully and users notified via email' });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/announcements/:id — delete announcement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
      return;
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
