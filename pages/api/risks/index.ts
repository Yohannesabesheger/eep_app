import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM risks');
      if (Array.isArray(rows)) {
        (rows as import('mysql2').RowDataPacket[]).forEach((row) => {
          if (row.created_at instanceof Date) row.created_at = row.created_at.toISOString();
        });
        return res.status(200).json(rows);
      } else {
        return res.status(200).json([]);
      }
    } else if (req.method === 'POST') {
      const { part_id, risk_type, severity, likelihood, status } = req.body;
      if (!part_id || !risk_type || !severity || !likelihood) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const [result] = await db.query(
        'INSERT INTO risks (part_id, risk_type, severity, likelihood, status) VALUES (?, ?, ?, ?, ?)',
        [part_id, risk_type, severity, likelihood, status || 'Open']
      );

      const insertId = (result as import('mysql2').ResultSetHeader).insertId;
      const [newRiskRows] = await db.query('SELECT * FROM risks WHERE risk_id = ?', [insertId]);
      const rowsArray = newRiskRows as import('mysql2').RowDataPacket[];
      const newRisk = rowsArray[0];
      if (newRisk && newRisk.created_at instanceof Date) newRisk.created_at = newRisk.created_at.toISOString();

      return res.status(201).json(newRisk);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Risks API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
