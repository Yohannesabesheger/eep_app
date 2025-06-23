// File: /pages/inventory.tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { db } from '@/utils/db';
import { Part } from '@/interfaces';

interface InventoryProps {
  parts: Part[];
}

interface NewPart {
  name: string;
  type: string;
  stock_level: number;
}

const InventoryPage: React.FC<InventoryProps> = ({ parts: initialParts }) => {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [newPart, setNewPart] = useState<NewPart>({ name: '', type: '', stock_level: 0 });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddPart = async (): Promise<void> => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPart),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || 'Failed to add part');
      }

      const added: Part = await res.json();
      setParts([...parts, added]);
      setNewPart({ name: '', type: '', stock_level: 0 });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: number, change: number): Promise<void> => {
    setError('');

    try {
      const res = await fetch('/api/inventory/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, change }),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || 'Failed to update stock');
      }

      const updatedPart: Part = await res.json();
      setParts((prev) =>
        prev.map((p) =>
          p.part_id === id ? { ...p, stock_level: updatedPart.stock_level } : p
        )
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Add New Part</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Part Name"
            value={newPart.name}
            onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
            className="border p-2 rounded w-full md:w-1/4"
          />
          <input
            type="text"
            placeholder="Type"
            value={newPart.type}
            onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
            className="border p-2 rounded w-full md:w-1/4"
          />
          <input
            type="number"
            placeholder="Stock"
            value={newPart.stock_level}
            onChange={(e) =>
              setNewPart({ ...newPart, stock_level: Number(e.target.value) })
            }
            className="border p-2 rounded w-full md:w-1/4"
          />
          <button
            onClick={handleAddPart}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            let status = 'Available';
            if (part.stock_level < 10) status = 'Critical';
            else if (part.stock_level < 20) status = 'Low';

            return (
              <tr key={part.part_id} className="border-t hover:bg-gray-50 transition">
                <td className="p-2">{part.part_id}</td>
                <td className="p-2">{part.name}</td>
                <td className="p-2">{part.type}</td>
                <td className="p-2">{part.stock_level}</td>
                <td className="p-2">
                  <span
                    className={`font-semibold px-2 py-1 rounded ${
                      status === 'Critical'
                        ? 'bg-red-100 text-red-600'
                        : status === 'Low'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="p-2 text-right space-x-2">
                  <button
                    onClick={() => updateStock(part.part_id, 1)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateStock(part.part_id, -1)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    −
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<InventoryProps> = async () => {
  const [rows] = await db.query('SELECT * FROM parts');
  return {
    props: {
      parts: rows as Part[],
    },
  };
};

export default InventoryPage;
