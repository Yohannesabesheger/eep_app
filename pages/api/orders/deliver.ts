import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Update order status to delivered
      await db.query(
        'UPDATE part_orders SET status = "delivered", delivered_at = NOW() WHERE order_id = ?',
        [orderId]
      );

      // Get updated order
      const [orders] = await db.query('SELECT * FROM part_orders WHERE order_id = ?', [orderId]);
      const updatedOrder = Array.isArray(orders) ? orders[0] : null;

      res.status(200).json({
        updatedOrder,
        message: 'Order marked as delivered'
      });

    } catch (error) {
      console.error('Error delivering order:', error);
      res.status(500).json({ error: 'Failed to deliver order' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}