// File: /pages/api/inventory/update-stock.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, change } = req.body;

  if (typeof id !== 'number' || typeof change !== 'number') {
    return res.status(400).json({ message: 'Invalid request data: "id" and "change" must be numbers' });
  }

  try {
    await db.query(
      'UPDATE parts SET stock_level = stock_level + ? WHERE part_id = ?',
      [change, id]
    );

    const [rows, fields]: [any[], any] = await db.query(
      'SELECT * FROM parts WHERE part_id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Part not found after update' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Database update error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

