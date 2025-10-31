import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, contact_email, contact_phone, performance_rating, lead_time_days } = req.body;

      // Basic validation
      if (!name) {
        return res.status(400).json({ error: 'Supplier name is required' });
      }

      const [result] = await db.query(
        'INSERT INTO suppliers (name, contact_email, contact_phone, performance_rating, lead_time_days) VALUES (?, ?, ?, ?, ?)',
        [name, contact_email, contact_phone, performance_rating, lead_time_days]
      );

      res.status(201).json({ message: 'Supplier added successfully', result });
    } catch (error) {
      console.error('Error adding supplier:', error);
      res.status(500).json({ error: 'Failed to add supplier' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}