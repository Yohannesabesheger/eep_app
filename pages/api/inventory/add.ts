// File: /pages/api/inventory/add.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { name, type, location, stock_level, min_threshold, max_threshold, supplier_id } = req.body;

    if (!name || !type || stock_level == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result]: any = await db.query(
      `INSERT INTO parts (name, type, location, stock_level, min_threshold, max_threshold, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, location || '', stock_level, min_threshold || 5, max_threshold || 100, supplier_id || null]
    );

    res.status(200).json({ message: 'Part added successfully', partId: result.insertId });
  } catch (err) {
    console.error('Add part error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
