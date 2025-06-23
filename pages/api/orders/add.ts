import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { part_id, quantity } = req.body;

    if (!part_id || quantity < 1) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // For demo, assuming user_id 1 as ordered_by; replace with actual user from session/token
    const ordered_by = 1;

    const [result]: any = await db.query(
      'INSERT INTO part_orders (part_id, quantity, ordered_by) VALUES (?, ?, ?)',
      [part_id, quantity, ordered_by]
    );

    // Get inserted order id
    const insertId = (result as { insertId: number }).insertId;

    // Fetch the newly added order to return
    const [rows]: [any[], any] = await db.query('SELECT * FROM part_orders WHERE order_id = ?', [insertId]);

    if (rows.length === 0) {
      return res.status(500).json({ message: 'Order creation failed' });
    }

    const newOrder = rows[0];
    // Serialize date for JSON
    if (newOrder.created_at instanceof Date) {
      newOrder.created_at = newOrder.created_at.toISOString();
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    console.error('Add order error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
