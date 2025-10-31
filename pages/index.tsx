// File: /pages/index.tsx - Dashboard (Main Panel)

import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { db } from '@/utils/db';
import { DashboardProps, Part } from '@/interfaces';
import nookies from 'nookies';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Function to calculate status based on stock level
const getStockStatus = (stockLevel: number) => {
  if (stockLevel < 5) return { status: 'Critical', class: 'text-red-500' };
  if (stockLevel < 15) return { status: 'Low', class: 'text-yellow-500' };
  return { status: 'Available', class: 'text-green-500' };
};

const Home: React.FC<DashboardProps> = ({ parts }) => {
  // Calculate summary statistics
  const criticalCount = parts.filter(part => part.stock_level < 5).length;
  const lowCount = parts.filter(part => part.stock_level >= 5 && part.stock_level < 15).length;
  const availableCount = parts.filter(part => part.stock_level >= 15).length;
  const totalParts = parts.length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-700">Total Parts</h3>
          <p className="text-2xl font-bold text-blue-600">{totalParts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-700">Available</h3>
          <p className="text-2xl font-bold text-green-600">{availableCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-700">Low Stock</h3>
          <p className="text-2xl font-bold text-yellow-600">{lowCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-700">Critical</h3>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {parts.map((part) => {
          const { status, class: statusClass } = getStockStatus(part.stock_level);
          
          return (
            <div 
              key={part.part_id} 
              className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                status === 'Critical' ? 'bg-red-50 border-red-200' :
                status === 'Low' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
            >
              <h2 className="font-semibold text-lg mb-2 text-gray-800">{part.name}</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Type:</span> {part.type}</p>
                <p><span className="font-medium">Stock Level:</span> {part.stock_level}</p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`font-bold ${statusClass}`}>
                    {status}
                  </span>
                </p>
                {status === 'Critical' && (
                  <p className="text-xs text-red-600 font-medium">⚠️ Immediate attention required</p>
                )}
                {status === 'Low' && (
                  <p className="text-xs text-yellow-600 font-medium">⚠️ Consider restocking soon</p>
                )}
              </div>
              <Link 
                href={`/inventory/${part.part_id}`} 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-3 inline-block"
              >
                View Details →
              </Link>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {parts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No parts found</h3>
          <p className="text-gray-500 mb-4">Get started by adding parts to your inventory.</p>
          <Link 
            href="/inventory" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Manage Inventory
          </Link>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = nookies.get(ctx);
  const token = cookies.auth_token;

  if (!token) {
    // Redirect to login if no token
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, SECRET);

    // If token valid, fetch parts and return props
    const [rows] = await db.query('SELECT * FROM parts ORDER BY stock_level ASC');
    const parts = rows as Part[];

    return {
      props: {
        parts: JSON.parse(JSON.stringify(parts)),
      },
    };
  } catch (err) {
    // Token invalid - redirect to login
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default Home;