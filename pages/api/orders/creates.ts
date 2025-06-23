import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { verifyToken } from '@/utils/auth';
import { db } from '@/utils/db';
import { JwtPayload } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Only POST allowed' });

  const { part_id, quantity } = req.body;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  const user = verifyToken(token);

  // Type guard: ensure user is JwtPayload and has user_id
  if (
    !user ||
    typeof user === 'string' ||
    !('user_id' in user) ||
    typeof (user as JwtPayload & { user_id: number }).user_id !== 'number'
  ) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  try {
    const [rows]: any = await db.query('SELECT * FROM parts WHERE part_id = ?', [part_id]);
    if (!rows.length) return res.status(404).json({ message: 'Part not found' });

    const part = rows[0];

    if (part.stock_level < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Now safely cast user to type with user_id
    const userPayload = user as JwtPayload & { user_id: number };

    // Create order
    await db.query(
      'INSERT INTO part_orders (part_id, quantity, ordered_by, status) VALUES (?, ?, ?, ?)',
      [part_id, quantity, userPayload.user_id, 'Pending']
    );

    // Reduce stock
    await db.query(
      'UPDATE parts SET stock_level = stock_level - ? WHERE part_id = ?',
      [quantity, part_id]
    );

    res.status(200).json({ part_id, quantity });
  } catch (err) {
    console.error('[ORDER ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
}
