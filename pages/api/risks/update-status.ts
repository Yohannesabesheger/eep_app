import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { riskId, status } = req.body;

      if (!riskId || !status) {
        return res.status(400).json({ error: 'Risk ID and status are required' });
      }

      // Update risk status
      await db.query(
        'UPDATE risks SET status = ? WHERE risk_id = ?',
        [status, riskId]
      );

      // Get updated risk
      const [risks] = await db.query(
        `SELECT r.*, p.name AS part_name 
         FROM risks r 
         LEFT JOIN parts p ON r.part_id = p.part_id 
         WHERE r.risk_id = ?`,
        [riskId]
      );

      const risk = Array.isArray(risks) ? risks[0] : null;

      res.status(200).json({
        risk,
        message: 'Risk status updated successfully'
      });

    } catch (error) {
      console.error('Error updating risk status:', error);
      res.status(500).json({ error: 'Failed to update risk status' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}