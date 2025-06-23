import type { NextApiRequest, NextApiResponse } from 'next';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '@/utils/db';

interface Supplier extends RowDataPacket {
  supplier_id: number;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  performance_rating: number | null;
  lead_time_days: number | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch all suppliers
      const [rows] = await db.query<Supplier[]>('SELECT * FROM suppliers');
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { name, contact_email, contact_phone, performance_rating, lead_time_days } = req.body;
      if (!name) return res.status(400).json({ message: 'Name is required' });

      // Insert new supplier
      const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO suppliers (name, contact_email, contact_phone, performance_rating, lead_time_days) VALUES (?, ?, ?, ?, ?)',
        [name, contact_email || null, contact_phone || null, performance_rating || null, lead_time_days || null]
      );

      const insertId = result.insertId;

      // Fetch newly inserted supplier by insertId
      const [newSupplierRows] = await db.query<Supplier[]>('SELECT * FROM suppliers WHERE supplier_id = ?', [insertId]);

      // newSupplierRows is an array, send the first item
      return res.status(201).json(newSupplierRows[0]);
    } 
    
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
