import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Get order details
      const [orders] = await db.query('SELECT * FROM part_orders WHERE order_id = ?', [orderId]);
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orders[0];

      // Start transaction
      await db.query('START TRANSACTION');

      try {
        // Update order status to Cancelled
        await db.query(
          'UPDATE part_orders SET status = "Cancelled" WHERE order_id = ?',
          [orderId]
        );

        // Restore inventory if order was Pending
        let inventoryRestored = false;
        if (order.status === 'Pending') {
          await db.query(
            'UPDATE parts SET stock_level = stock_level + ? WHERE part_id = ?',
            [order.quantity, order.part_id]
          );
          inventoryRestored = true;
        }

        await db.query('COMMIT');

        // Get updated order with details
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
          inventoryRestored,
          message: 'Order cancelled successfully'
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to cancel order' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}