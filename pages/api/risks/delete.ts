import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { riskId } = req.body;

      if (!riskId) {
        return res.status(400).json({ error: 'Risk ID is required' });
      }

      // Delete the risk
      await db.query('DELETE FROM risks WHERE risk_id = ?', [riskId]);

      res.status(200).json({ message: 'Risk deleted successfully' });

    } catch (error) {
      console.error('Error deleting risk:', error);
      res.status(500).json({ error: 'Failed to delete risk' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}