import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { part_id, risk_type, description, severity, likelihood, impact, mitigation_plan, status } = req.body;

      // Validation
      if (!risk_type || !description || !severity || !likelihood) {
        return res.status(400).json({ error: 'Risk type, description, severity, and likelihood are required' });
      }

      // Start transaction
      await db.query('START TRANSACTION');

      try {
        // Create risk
        const [riskResult] = await db.query(
          `INSERT INTO risks (part_id, risk_type, description, severity, likelihood, impact, mitigation_plan, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [part_id || null, risk_type, description, severity, likelihood, impact, mitigation_plan, status]
        );

        const riskId = (riskResult as any).insertId;

        // Create notification for high severity risks
        let notificationCreated = false;
        if (severity === 'High' || severity === 'Critical') {
          const partName = part_id ? await getPartName(part_id) : 'General';
          const message = `New ${severity.toLowerCase()} risk identified: ${risk_type} - ${description.substring(0, 100)}...`;
          
          await db.query(
            `INSERT INTO notifications (type, message, status, risk_id) 
             VALUES ('Risk', ?, 'Pending', ?)`,
            [message, riskId]
          );
          notificationCreated = true;
        }

        await db.query('COMMIT');

        // Get the created risk with part name
        const [risks] = await db.query(
          `SELECT r.*, p.name AS part_name 
           FROM risks r 
           LEFT JOIN parts p ON r.part_id = p.part_id 
           WHERE r.risk_id = ?`,
          [riskId]
        );

        const risk = Array.isArray(risks) ? risks[0] : null;

        res.status(201).json({
          risk,
          notificationCreated
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error creating risk:', error);
      res.status(500).json({ error: 'Failed to create risk' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getPartName(partId: number): Promise<string> {
  const [parts] = await db.query('SELECT name FROM parts WHERE part_id = ?', [partId]);
  return Array.isArray(parts) && parts.length > 0 ? (parts[0] as any).name : 'Unknown Part';
}