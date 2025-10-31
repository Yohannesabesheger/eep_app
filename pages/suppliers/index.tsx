import { GetServerSideProps } from 'next';
import { db } from '@/utils/db';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface Supplier {
  supplier_id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  performance_rating: number;
  lead_time_days: number;
}

interface SuppliersPageProps {
  suppliers: Supplier[];
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers }) => {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    performance_rating: 5,
    lead_time_days: 7
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'performance_rating' || name === 'lead_time_days' ? Number(value) : value
    }));
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          name: '',
          contact_email: '',
          contact_phone: '',
          performance_rating: 5,
          lead_time_days: 7
        });
        router.replace(router.asPath); // Refresh the page data
      } else {
        alert('Failed to add supplier');
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Error adding supplier');
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.replace(router.asPath); // Refresh the page data
      } else {
        alert('Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error deleting supplier');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Supplier
        </button>
      </div>

      {/* Add Supplier Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Performance Rating</label>
                <select
                  name="performance_rating"
                  value={formData.performance_rating}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} {rating === 1 ? 'Star' : 'Stars'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  name="lead_time_days"
                  value={formData.lead_time_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Time (Days)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.supplier_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {supplier.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.contact_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.contact_phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-1">{supplier.performance_rating}</span>
                    <span>⭐</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.lead_time_days}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDeleteSupplier(supplier.supplier_id)}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No suppliers found. Add your first supplier above.
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY name');
  return {
    props: {
      suppliers: JSON.parse(JSON.stringify(suppliers)),
    },
  };
};

export default SuppliersPage;
// import { GetServerSideProps } from 'next';
// import { db } from '@/utils/db';

// interface Supplier {
//   supplier_id: number;
//   name: string;
//   contact_email: string;
//   contact_phone: string;
//   performance_rating: number;
//   lead_time_days: number;
// }

// interface SuppliersPageProps {
//   suppliers: Supplier[];
// }

// const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers }) => {
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
//       <table className="w-full border">
//         <thead>
//           <tr className="bg-gray-200">
//             <th>Name</th>
//             <th>Email</th>
//             <th>Phone</th>
//             <th>Rating</th>
//             <th>Lead Time (Days)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {suppliers.map((s) => (
//             <tr key={s.supplier_id} className="border-t">
//               <td>{s.name}</td>
//               <td>{s.contact_email}</td>
//               <td>{s.contact_phone}</td>
//               <td>{s.performance_rating}</td>
//               <td>{s.lead_time_days}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export const getServerSideProps: GetServerSideProps = async () => {
//   const [suppliers] = await db.query('SELECT * FROM suppliers');
//   return {
//     props: {
//       suppliers,
//     },
//   };
// };

// export default SuppliersPage;
