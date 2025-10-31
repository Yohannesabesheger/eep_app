// File: /pages/orders/index.tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { db } from '@/utils/db';
import { Part, PartOrder, User } from '@/interfaces';

interface OrdersPageProps {
  orders: PartOrder[];
  parts: Part[];
  users: User[];
}

const OrdersPage: React.FC<OrdersPageProps> = ({ orders: initialOrders, parts, users }) => {
  const [orders, setOrders] = useState<PartOrder[]>(initialOrders);
  const [newOrder, setNewOrder] = useState({ 
    part_id: 0, 
    quantity: 1, 
    ordered_by: 0,
    priority: 'Medium'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const showNotification = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 3000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddOrder = async () => {
    if (newOrder.part_id === 0) {
      showNotification('Please select a part', true);
      return;
    }
    if (newOrder.ordered_by === 0) {
      showNotification('Please select a user', true);
      return;
    }
    if (newOrder.quantity < 1) {
      showNotification('Quantity must be at least 1', true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add order');
      }

      const { order: addedOrder, inventoryUpdated } = await res.json();
      setOrders((prev) => [...prev, addedOrder]);
      setNewOrder({ part_id: 0, quantity: 1, ordered_by: 0, priority: 'Medium' });
      
      if (inventoryUpdated) {
        showNotification('Order placed successfully and inventory updated!');
      } else {
        showNotification('Order placed successfully!');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const res = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to complete order');
      }

      const { updatedOrder } = await res.json();
      
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? updatedOrder : order
        )
      );
      
      showNotification('Order marked as completed!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to cancel order');
      }

      const { updatedOrder, inventoryRestored } = await res.json();
      
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? updatedOrder : order
        )
      );
      
      if (inventoryRestored) {
        showNotification('Order cancelled and inventory restored!');
      } else {
        showNotification('Order cancelled successfully!');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClasses[priority as keyof typeof priorityClasses] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      Admin: 'bg-purple-100 text-purple-800',
      'Warehouse Staff': 'bg-blue-100 text-blue-800',
      'Maintenance Staff': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleClasses[role as keyof typeof roleClasses] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Part Orders Management</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create New Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Part *</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={newOrder.part_id}
              onChange={(e) => setNewOrder({ ...newOrder, part_id: Number(e.target.value) })}
            >
              <option value={0}>Choose a part</option>
              {parts.map((part) => (
                <option key={part.part_id} value={part.part_id}>
                  {part.name} (Stock: {part.stock_level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ordered By *</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={newOrder.ordered_by}
              onChange={(e) => setNewOrder({ ...newOrder, ordered_by: Number(e.target.value) })}
            >
              <option value={0}>Choose a user</option>
              {users.filter(user => user.status === 1).map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input
              type="number"
              min={1}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={newOrder.quantity}
              onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={newOrder.priority}
              onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleAddOrder}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const part = parts.find((p) => p.part_id === order.part_id);
              const user = users.find((u) => u.user_id === order.ordered_by);
              
              return (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.order_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part ? part.name : 'Unknown Part'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user ? user.name : 'Unknown User'}
                    <div className="text-xs text-gray-500">{user?.company_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user ? getRoleBadge(user.role) : 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(order.priority)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {order.status === 'Pending' && (
                      <>
                        <button onClick={() => handleCompleteOrder(order.order_id)} className="text-green-600 hover:text-green-900">Complete</button>
                        <button onClick={() => handleCancelOrder(order.order_id)} className="text-red-600 hover:text-red-900">Cancel</button>
                      </>
                    )}
                    {(order.status === 'Completed' || order.status === 'Cancelled') && (
                      <span className="text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">No orders found.</div>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [partsResult] = await db.query('SELECT * FROM parts');
    const parts = partsResult as Part[];

    const [usersResult] = await db.query('SELECT * FROM users WHERE status = 1');
    const users = usersResult as User[];

    const [ordersResult] = await db.query(`
      SELECT po.*, p.name as part_name, u.name as user_name, u.role as user_role, u.company_id
      FROM part_orders po
      LEFT JOIN parts p ON po.part_id = p.part_id
      LEFT JOIN users u ON po.ordered_by = u.user_id
      ORDER BY po.created_at DESC
    `);
    const ordersRaw = ordersResult as any[];

    const orders: PartOrder[] = ordersRaw.map((order) => ({
      order_id: order.order_id,
      part_id: order.part_id,
      quantity: order.quantity,
      ordered_by: order.ordered_by,
      priority: order.priority || 'Medium',
      status: order.status,
      created_at: order.created_at instanceof Date ? order.created_at.toISOString() : String(order.created_at),
    }));

    return {
      props: {
        parts: JSON.parse(JSON.stringify(parts)),
        users: JSON.parse(JSON.stringify(users)),
        orders: JSON.parse(JSON.stringify(orders)),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        parts: [],
        users: [],
        orders: [],
      },
    };
  }
};

export default OrdersPage;