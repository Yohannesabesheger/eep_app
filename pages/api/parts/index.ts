import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';
import type { RowDataPacket, OkPacket } from 'mysql2';

interface Part extends RowDataPacket {
  part_id: number;
  name: string;
  type: string | null;
  location: string | null;
  stock_level: number;
  min_threshold: number;
  max_threshold: number;
  supplier_id: number | null;
  image_url: string | null;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // List all parts
      const [rows] = await db.query<Part[]>('SELECT * FROM parts');
      return res.status(200).json(rows);
    } else if (req.method === 'POST') {
      // Create new part
      const {
        name,
        type,
        location,
        stock_level,
        min_threshold,
        max_threshold,
        supplier_id,
        image_url,
        status,
      } = req.body;

      if (!name) return res.status(400).json({ message: 'Name is required' });

      const [result] = await db.query<OkPacket>(
        `INSERT INTO parts (name, type, location, stock_level, min_threshold, max_threshold, supplier_id, image_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          type || null,
          location || null,
          stock_level || 0,
          min_threshold || 5,
          max_threshold || 100,
          supplier_id || null,
          image_url || null,
          status || 'Available',
        ]
      );

      const insertId = result.insertId;

      // Query the newly created part
      const [rows] = await db.query<Part[]>('SELECT * FROM parts WHERE part_id = ?', [insertId]);

      // rows is guaranteed to be an array, return the first element or null
      const newPart = rows.length > 0 ? rows[0] : null;

      return res.status(201).json(newPart);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Parts API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
