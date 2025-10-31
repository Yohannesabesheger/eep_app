import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      // Update notification status to Resolved
      await db.query(
        'UPDATE notifications SET status = "Resolved" WHERE notification_id = ?',
        [notificationId]
      );

      res.status(200).json({ 
        message: 'Notification marked as resolved',
        notificationId 
      });

    } catch (error) {
      console.error('Error resolving notification:', error);
      res.status(500).json({ error: 'Failed to resolve notification' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}