// // File: /pages/api/inventory/update-stock.ts

// import type { NextApiRequest, NextApiResponse } from 'next';
// import { db } from '@/utils/db';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ): Promise<void> {
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   const { id, change } = req.body;

//   if (typeof id !== 'number' || typeof change !== 'number') {
//     return res.status(400).json({ message: 'Invalid request data: "id" and "change" must be numbers' });
//   }

//   try {
//     await db.query(
//       'UPDATE parts SET stock_level = stock_level + ? WHERE part_id = ?',
//       [change, id]
//     );

//     const [rows, fields]: [any[], any] = await db.query(
//       'SELECT * FROM parts WHERE part_id = ?',
//       [id]
//     );

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ message: 'Part not found after update' });
//     }

//     return res.status(200).json(rows[0]);
//   } catch (error) {
//     console.error('Database update error:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// }

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { partId, change } = req.body;

      if (!partId || change === undefined) {
        return res.status(400).json({ error: 'Part ID and change are required' });
      }

      // Get current part
      const [parts] = await db.query('SELECT * FROM parts WHERE part_id = ?', [partId]);
      
      if (!Array.isArray(parts) || parts.length === 0) {
        return res.status(404).json({ error: 'Part not found' });
      }

      const part = parts[0];
      const newStockLevel = part.stock_level + change;

      if (newStockLevel < 0) {
        return res.status(400).json({ error: 'Insufficient stock for this order' });
      }

      // Update stock level
      await db.query('UPDATE parts SET stock_level = ? WHERE part_id = ?', [newStockLevel, partId]);

      // Get updated part
      const [updatedParts] = await db.query('SELECT * FROM parts WHERE part_id = ?', [partId]);
      const updatedPart = updatedParts[0];

      // Check for critical level and create notification
      let notification = null;
      if (newStockLevel < 5) {
        notification = `Critical stock level for ${part.name}! Only ${newStockLevel} units left.`;
        
        // You can also store this notification in a database table
        // await db.query(
        //   'INSERT INTO notifications (message, type, part_id) VALUES (?, ?, ?)',
        //   [notification, 'critical_stock', partId]
        // );
      } else if (newStockLevel < 15 && part.stock_level >= 15) {
        notification = `Low stock alert for ${part.name}! ${newStockLevel} units remaining.`;
      }

      res.status(200).json({
        updatedPart,
        notification
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}