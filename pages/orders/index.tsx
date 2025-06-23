// File: /pages/orders/index.tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { db } from '@/utils/db';
import { Part, PartOrder } from '@/interfaces';

interface OrdersPageProps {
  orders: PartOrder[];
  parts: Part[];
}

const OrdersPage: React.FC<OrdersPageProps> = ({ orders: initialOrders, parts }) => {
  const [orders, setOrders] = useState<PartOrder[]>(initialOrders);
  const [newOrder, setNewOrder] = useState({ part_id: 0, quantity: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddOrder = async () => {
    if (newOrder.part_id === 0) {
      setError('Please select a part');
      return;
    }
    if (newOrder.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setError('');
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

      const addedOrder = await res.json();
      setOrders((prev) => [...prev, addedOrder]);
      setNewOrder({ part_id: 0, quantity: 1 });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Part Orders</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full border mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th>Order ID</th>
            <th>Part Name</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Ordered At</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const part = parts.find((p) => p.part_id === order.part_id);
            return (
              <tr key={order.order_id} className="border-t">
                <td>{order.order_id}</td>
                <td>{part ? part.name : 'Unknown Part'}</td>
                <td>{order.quantity}</td>
                <td>{order.status}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border p-4 rounded bg-gray-50 max-w-md">
        <h2 className="text-lg font-semibold mb-3">Add New Order</h2>

        <select
          className="w-full p-2 border rounded mb-3"
          value={newOrder.part_id}
          onChange={(e) => setNewOrder({ ...newOrder, part_id: Number(e.target.value) })}
        >
          <option value={0}>Select Part</option>
          {parts.map((part) => (
            <option key={part.part_id} value={part.part_id}>
              {part.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          className="w-full p-2 border rounded mb-3"
          value={newOrder.quantity}
          onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
        />

        <button
          onClick={handleAddOrder}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Adding...' : 'Add Order'}
        </button>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const partsResult = await db.query('SELECT * FROM parts');
  const partsRows = partsResult[0] as Part[];

  const ordersResult = await db.query('SELECT * FROM part_orders');
  const ordersRaw = ordersResult[0] as PartOrder[];

  const orders: PartOrder[] = ordersRaw.map((order) => ({
    ...order,
    created_at:
      order.created_at instanceof Date
        ? order.created_at.toISOString()
        : String(order.created_at),
  }));

  return {
    props: {
      parts: partsRows,
      orders,
    },
  };
};

export default OrdersPage;
