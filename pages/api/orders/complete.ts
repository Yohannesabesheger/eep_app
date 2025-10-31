import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Check if order exists
      const [orders] = await db.query('SELECT * FROM part_orders WHERE order_id = ?', [orderId]);
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orders[0];

      // Update order status to Completed
      await db.query(
        'UPDATE part_orders SET status = "Completed" WHERE order_id = ?',
        [orderId]
      );

      // Get updated order with part and user details
      const [updatedOrders] = await db.query(`
        SELECT po.*, p.name as part_name, u.name as user_name, u.email as user_email
        FROM part_orders po
        LEFT JOIN parts p ON po.part_id = p.part_id
        LEFT JOIN users u ON po.ordered_by = u.user_id
        WHERE po.order_id = ?
      `, [orderId]);

      const updatedOrder = Array.isArray(updatedOrders) ? updatedOrders[0] : null;

      // Convert Date objects to strings for JSON serialization
      const serializedOrder = updatedOrder ? {
        ...updatedOrder,
        created_at: updatedOrder.created_at instanceof Date 
          ? updatedOrder.created_at.toISOString() 
          : String(updatedOrder.created_at)
      } : null;

      res.status(200).json({
        success: true,
        updatedOrder: serializedOrder,
        message: 'Order marked as completed successfully'
      });

    } catch (error) {
      console.error('Error completing order:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to complete order' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}