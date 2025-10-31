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

interface OrderModalProps {
  part: Part;
  onClose: () => void;
  onOrder: (quantity: number) => void;
  type: 'order' | 'add';
}

const OrderModal: React.FC<OrderModalProps> = ({ part, onClose, onOrder, type }) => {
  const [quantity, setQuantity] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuantity = type === 'order' ? -Math.abs(quantity) : Math.abs(quantity);
    onOrder(finalQuantity);
  };

  const maxOrder = type === 'order' ? part.stock_level : 1000; // Reasonable limit for adding stock

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {type === 'order' ? 'Place Order' : 'Add Inventory'} - {part.name}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Quantity {type === 'order' ? 'to Order' : 'to Add'}
            </label>
            <input
              type="number"
              min="1"
              max={maxOrder}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-2 border rounded"
              required
            />
            {type === 'order' && (
              <p className="text-sm text-gray-600 mt-1">
                Current stock: {part.stock_level}
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className={`flex-1 text-white px-4 py-2 rounded ${
                type === 'order' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {type === 'order' ? 'Place Order' : 'Add to Inventory'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryPage: React.FC<InventoryProps> = ({ parts: initialParts }) => {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [newPart, setNewPart] = useState<NewPart>({ name: '', type: '', stock_level: 0 });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<{
    part: Part;
    type: 'order' | 'add';
  } | null>(null);

  // Clear notifications after 3 seconds
  const showNotification = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 3000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddPart = async (): Promise<void> => {
    setError('');
    setSuccess('');
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
      showNotification('Part added successfully!');
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (partId: number, change: number): Promise<void> => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/inventory/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, change }),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || 'Failed to update stock');
      }

      const { updatedPart, notification } = await res.json();
      
      // Update the parts list
      setParts((prev) =>
        prev.map((p) =>
          p.part_id === partId ? { ...p, stock_level: updatedPart.stock_level } : p
        )
      );

      // Show success message
      const action = change < 0 ? 'Order placed' : 'Inventory added';
      showNotification(`${action} successfully!`);

      // Show critical level notification if applicable
      if (notification) {
        setTimeout(() => {
          showNotification(`🚨 ${notification}`, true);
        }, 500);
      }
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const getStockStatus = (stockLevel: number) => {
    if (stockLevel < 5) return { status: 'Critical', class: 'bg-red-100 text-red-600' };
    if (stockLevel < 15) return { status: 'Low', class: 'bg-yellow-100 text-yellow-600' };
    return { status: 'Available', class: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      {/* Notifications */}
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

      {/* Add New Part Section */}
      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Part</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Part Name</label>
            <input
              type="text"
              placeholder="Enter part name"
              value={newPart.name}
              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <input
              type="text"
              placeholder="Enter type"
              value={newPart.type}
              onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Initial Stock</label>
            <input
              type="number"
              placeholder="Stock level"
              value={newPart.stock_level}
              onChange={(e) =>
                setNewPart({ ...newPart, stock_level: Number(e.target.value) })
              }
              min="0"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddPart}
            disabled={loading || !newPart.name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-10"
          >
            {loading ? 'Adding...' : 'Add Part'}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parts.map((part) => {
              const { status, class: statusClass } = getStockStatus(part.stock_level);
              
              return (
                <tr key={part.part_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {part.part_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {part.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {part.stock_level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setModal({ part, type: 'order' })}
                      disabled={part.stock_level <= 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Place Order
                    </button>
                    <button
                      onClick={() => setModal({ part, type: 'add' })}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Add Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {parts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No parts found. Add your first part above.
          </div>
        )}
      </div>

      {/* Order/Add Modal */}
      {modal && (
        <OrderModal
          part={modal.part}
          type={modal.type}
          onClose={() => setModal(null)}
          onOrder={(quantity) => {
            updateStock(modal.part.part_id, quantity);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<InventoryProps> = async () => {
  const [rows] = await db.query('SELECT * FROM parts ORDER BY part_id');
  return {
    props: {
      parts: JSON.parse(JSON.stringify(rows)),
    },
  };
};

export default InventoryPage;
// // File: /pages/inventory.tsx
// import { GetServerSideProps } from 'next';
// import { useState } from 'react';
// import { db } from '@/utils/db';
// import { Part } from '@/interfaces';

// interface InventoryProps {
//   parts: Part[];
// }

// interface NewPart {
//   name: string;
//   type: string;
//   stock_level: number;
// }

// const InventoryPage: React.FC<InventoryProps> = ({ parts: initialParts }) => {
//   const [parts, setParts] = useState<Part[]>(initialParts);
//   const [newPart, setNewPart] = useState<NewPart>({ name: '', type: '', stock_level: 0 });
//   const [error, setError] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(false);

//   const handleAddPart = async (): Promise<void> => {
//     setError('');
//     setLoading(true);

//     try {
//       const res = await fetch('/api/inventory/add', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newPart),
//       });

//       if (!res.ok) {
//         const { message } = await res.json();
//         throw new Error(message || 'Failed to add part');
//       }

//       const added: Part = await res.json();
//       setParts([...parts, added]);
//       setNewPart({ name: '', type: '', stock_level: 0 });
//     } catch (err) {
//       if (err instanceof Error) {
//         setError(err.message);
//       } else {
//         setError('An unknown error occurred');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateStock = async (id: number, change: number): Promise<void> => {
//     setError('');

//     try {
//       const res = await fetch('/api/inventory/update-stock', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id, change }),
//       });

//       if (!res.ok) {
//         const { message } = await res.json();
//         throw new Error(message || 'Failed to update stock');
//       }

//       const updatedPart: Part = await res.json();
//       setParts((prev) =>
//         prev.map((p) =>
//           p.part_id === id ? { ...p, stock_level: updatedPart.stock_level } : p
//         )
//       );
//     } catch (err) {
//       if (err instanceof Error) {
//         setError(err.message);
//       } else {
//         setError('An unknown error occurred');
//       }
//     }
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

//       {error && <p className="text-red-600 mb-4">{error}</p>}

//       <div className="mb-6 p-4 border rounded bg-gray-50">
//         <h2 className="font-semibold mb-2">Add New Part</h2>
//         <div className="flex flex-wrap gap-3 items-center">
//           <input
//             type="text"
//             placeholder="Part Name"
//             value={newPart.name}
//             onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
//             className="border p-2 rounded w-full md:w-1/4"
//           />
//           <input
//             type="text"
//             placeholder="Type"
//             value={newPart.type}
//             onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
//             className="border p-2 rounded w-full md:w-1/4"
//           />
//           <input
//             type="number"
//             placeholder="Stock"
//             value={newPart.stock_level}
//             onChange={(e) =>
//               setNewPart({ ...newPart, stock_level: Number(e.target.value) })
//             }
//             className="border p-2 rounded w-full md:w-1/4"
//           />
//           <button
//             onClick={handleAddPart}
//             disabled={loading}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           >
//             {loading ? 'Adding...' : 'Add'}
//           </button>
//         </div>
//       </div>

//       <table className="w-full border text-sm">
//         <thead>
//           <tr className="bg-gray-200 text-left">
//             <th className="p-2">ID</th>
//             <th className="p-2">Name</th>
//             <th className="p-2">Type</th>
//             <th className="p-2">Stock</th>
//             <th className="p-2">Status</th>
//             <th className="p-2 text-right">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {parts.map((part) => {
//             let status = 'Available';
//             if (part.stock_level < 10) status = 'Critical';
//             else if (part.stock_level < 20) status = 'Low';

//             return (
//               <tr key={part.part_id} className="border-t hover:bg-gray-50 transition">
//                 <td className="p-2">{part.part_id}</td>
//                 <td className="p-2">{part.name}</td>
//                 <td className="p-2">{part.type}</td>
//                 <td className="p-2">{part.stock_level}</td>
//                 <td className="p-2">
//                   <span
//                     className={`font-semibold px-2 py-1 rounded ${
//                       status === 'Critical'
//                         ? 'bg-red-100 text-red-600'
//                         : status === 'Low'
//                         ? 'bg-yellow-100 text-yellow-600'
//                         : 'bg-green-100 text-green-600'
//                     }`}
//                   >
//                     {status}
//                   </span>
//                 </td>
//                 <td className="p-2 text-right space-x-2">
//                   <button
//                     onClick={() => updateStock(part.part_id, 1)}
//                     className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//                   >
//                     +
//                   </button>
//                   <button
//                     onClick={() => updateStock(part.part_id, -1)}
//                     className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
//                   >
//                     −
//                   </button>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export const getServerSideProps: GetServerSideProps<InventoryProps> = async () => {
//   const [rows] = await db.query('SELECT * FROM parts');
//   return {
//     props: {
//       parts: rows as Part[],
//     },
//   };
// };

// export default InventoryPage;
