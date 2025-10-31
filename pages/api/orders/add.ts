import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { part_id, quantity, ordered_by, priority = 'Medium' } = req.body;

      console.log('Creating order with data:', { part_id, quantity, ordered_by, priority });

      // Validation
      if (!part_id || !quantity || !ordered_by) {
        return res.status(400).json({ error: 'Part ID, quantity, and ordered_by are required' });
      }

      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Check if part exists and has sufficient stock
      const [parts] = await db.query('SELECT * FROM parts WHERE part_id = ?', [part_id]);
      if (!Array.isArray(parts) || parts.length === 0) {
        return res.status(404).json({ error: 'Part not found' });
      }

      const part = parts[0];
      console.log('Part found:', part.name, 'Current stock:', part.stock_level);

      if (part.stock_level < quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock. Only ${part.stock_level} units available.` 
        });
      }

      // Check if user exists and is active
      const [users] = await db.query('SELECT * FROM users WHERE user_id = ? AND status = 1', [ordered_by]);
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(404).json({ error: 'User not found or inactive' });
      }

      const user = users[0];
      const newStockLevel = part.stock_level - quantity;
      console.log('New stock level after order:', newStockLevel);

      // Start transaction
      await db.query('START TRANSACTION');

      try {
        // Create order with priority
        const [orderResult] = await db.query(
          `INSERT INTO part_orders (part_id, quantity, ordered_by, status, priority) 
           VALUES (?, ?, ?, 'Pending', ?)`,
          [part_id, quantity, ordered_by, priority]
        );

        console.log('Order created with ID:', (orderResult as any).insertId);

        // Update inventory
        await db.query(
          'UPDATE parts SET stock_level = stock_level - ? WHERE part_id = ?',
          [quantity, part_id]
        );

        console.log('Inventory updated');

        // Create notification for low stock if applicable
        let notificationCreated = false;
        let notificationMessage = '';

        if (newStockLevel < 5) {
          notificationMessage = `Critical stock level for ${part.name}! Only ${newStockLevel} units remaining after order.`;
          console.log('Creating critical stock notification:', notificationMessage);
          
          const [notificationResult] = await db.query(
            `INSERT INTO notifications (type, message, status, part_id) 
             VALUES ('Inventory', ?, 'Pending', ?)`,
            [notificationMessage, part_id]
          );
          notificationCreated = true;
          console.log('Critical notification created with ID:', (notificationResult as any).insertId);
        } else if (newStockLevel < 15) {
          notificationMessage = `Low stock alert for ${part.name}! ${newStockLevel} units remaining after order.`;
          console.log('Creating low stock notification:', notificationMessage);
          
          const [notificationResult] = await db.query(
            `INSERT INTO notifications (type, message, status, part_id) 
             VALUES ('Inventory', ?, 'Pending', ?)`,
            [notificationMessage, part_id]
          );
          notificationCreated = true;
          console.log('Low stock notification created with ID:', (notificationResult as any).insertId);
        }

        // Create notification for high priority orders
        if (priority === 'High' || priority === 'Urgent') {
          notificationMessage = `${priority} priority order placed for ${part.name} (Quantity: ${quantity}) by ${user.name}`;
          console.log('Creating priority order notification:', notificationMessage);
          
          const [notificationResult] = await db.query(
            `INSERT INTO notifications (type, message, status, part_id) 
             VALUES ('Inventory', ?, 'Pending', ?)`,
            [notificationMessage, part_id]
          );
          notificationCreated = true;
          console.log('Priority notification created with ID:', (notificationResult as any).insertId);
        }

        await db.query('COMMIT');
        console.log('Transaction committed');

        // Get the created order with user details
        const [newOrders] = await db.query(`
          SELECT po.*, p.name as part_name, u.name as user_name, u.role as user_role, u.company_id
          FROM part_orders po
          LEFT JOIN parts p ON po.part_id = p.part_id
          LEFT JOIN users u ON po.ordered_by = u.user_id
          WHERE po.order_id = ?
        `, [(orderResult as any).insertId]);

        const newOrder = Array.isArray(newOrders) ? newOrders[0] : null;

        res.status(201).json({
          order: newOrder,
          inventoryUpdated: true,
          notificationCreated,
          newStockLevel
        });

      } catch (error) {
        await db.query('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}