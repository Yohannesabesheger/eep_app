// File: /pages/inventory/[id].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { db } from '@/utils/db';
import nookies from 'nookies';
import jwt from 'jsonwebtoken';
import { useState } from 'react';
import Link from 'next/link';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface Part {
  part_id: number;
  name: string;
  type: string;
  stock_level: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface PartDetailProps {
  part: Part;
}

const PartDetail: React.FC<PartDetailProps> = ({ part }) => {
  const router = useRouter();
  const [stockChange, setStockChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Calculate stock status
  const getStockStatus = () => {
    if (part.stock_level < 5) {
      return {
        status: 'Critical',
        class: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔴',
        message: 'Immediate attention required - very low stock',
        level: 'critical'
      };
    } else if (part.stock_level < 15) {
      return {
        status: 'Low',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '🟡',
        message: 'Consider restocking soon',
        level: 'low'
      };
    } else if (part.stock_level < 30) {
      return {
        status: 'Adequate',
        class: 'bg-green-100 text-green-800 border-green-200',
        icon: '🟢',
        message: 'Stock level is adequate',
        level: 'adequate'
      };
    } else {
      return {
        status: 'Optimal',
        class: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🔵',
        message: 'Stock level is optimal',
        level: 'optimal'
      };
    }
  };

  const stockStatus = getStockStatus();

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleStockUpdate = async (change: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          partId: part.part_id, 
          change: change 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      showMessage(`Stock ${change > 0 ? 'increased' : 'decreased'} successfully!`, 'success');
      
      // Refresh the page to get updated data
      router.replace(router.asPath);
    } catch (error) {
      console.error('Error updating stock:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to update stock', 'error');
    } finally {
      setLoading(false);
      setStockChange(0);
    }
  };

  const handleCustomStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stockChange === 0) return;
    await handleStockUpdate(stockChange);
  };

  const getStockRecommendation = () => {
    if (part.stock_level < 5) {
      return {
        action: 'URGENT RESTOCK NEEDED',
        recommendation: `Order immediately. Minimum safe stock: 15 units. Need to order at least ${15 - part.stock_level} units.`,
        priority: 'high'
      };
    } else if (part.stock_level < 15) {
      return {
        action: 'Plan Restocking',
        recommendation: `Consider ordering soon. Recommended stock: 30 units. Suggested order: ${30 - part.stock_level} units.`,
        priority: 'medium'
      };
    } else if (part.stock_level < 30) {
      return {
        action: 'Monitor Stock',
        recommendation: 'Stock level is acceptable. Continue monitoring usage patterns.',
        priority: 'low'
      };
    } else {
      return {
        action: 'Stock Level Optimal',
        recommendation: 'No immediate action needed. Maintain current inventory levels.',
        priority: 'none'
      };
    }
  };

  const recommendation = getStockRecommendation();

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading part details...</p>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Part Not Found</h1>
          <p className="text-gray-600 mb-6">The part you're looking for doesn't exist.</p>
          <Link href="/inventory" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link href="/inventory" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              ← Back to Inventory
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{part.name}</h1>
            <p className="text-gray-600">Part ID: #{part.part_id}</p>
          </div>
          <div className={`px-4 py-2 rounded-full border ${stockStatus.class}`}>
            <span className="flex items-center space-x-2">
              <span>{stockStatus.icon}</span>
              <span className="font-semibold">{stockStatus.status}</span>
            </span>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Overview Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Stock Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{part.stock_level}</div>
                  <div className="text-sm text-gray-600">Current Stock</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stockStatus.class} px-3 py-1 rounded-full inline-block`}>
                    {stockStatus.status}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {stockStatus.icon}
                  </div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{stockStatus.message}</p>
              </div>
            </div>

            {/* Part Details Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Part Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Type</label>
                  <p className="text-gray-900">{part.type}</p>
                </div>
                {part.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{part.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part ID</label>
                  <p className="text-gray-900">#{part.part_id}</p>
                </div>
              </div>
            </div>

            {/* Quick Stock Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stock Actions</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => handleStockUpdate(1)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  +1 Add Stock
                </button>
                <button
                  onClick={() => handleStockUpdate(5)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  +5 Add Stock
                </button>
                <button
                  onClick={() => handleStockUpdate(-1)}
                  disabled={loading || part.stock_level <= 0}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  -1 Use Stock
                </button>
                <button
                  onClick={() => handleStockUpdate(-5)}
                  disabled={loading || part.stock_level < 5}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  -5 Use Stock
                </button>
              </div>

              {/* Custom Stock Adjustment */}
              <form onSubmit={handleCustomStockUpdate} className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Stock Adjustment
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={stockChange}
                    onChange={(e) => setStockChange(Number(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter positive or negative number"
                    min={-part.stock_level}
                  />
                  <button
                    type="submit"
                    disabled={loading || stockChange === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Positive numbers add stock, negative numbers remove stock
                </p>
              </form>
            </div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Stock Recommendation */}
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${
              recommendation.priority === 'high' ? 'border-red-200 bg-red-50' :
              recommendation.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-green-200 bg-green-50'
            }`}>
              <h2 className="text-xl font-semibold mb-3">Stock Recommendation</h2>
              <div className="space-y-3">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                    recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {recommendation.action}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{recommendation.recommendation}</p>
              </div>
            </div>

            {/* Stock Level Guide */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Stock Level Guide</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span>🔴</span>
                    <span>Critical</span>
                  </span>
                  <span className="text-gray-600">&lt; 5 units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span>🟡</span>
                    <span>Low</span>
                  </span>
                  <span className="text-gray-600">5 - 14 units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span>🟢</span>
                    <span>Adequate</span>
                  </span>
                  <span className="text-gray-600">15 - 29 units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span>🔵</span>
                    <span>Optimal</span>
                  </span>
                  <span className="text-gray-600">30+ units</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/orders?part=${part.part_id}`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center block"
                >
                  Order This Part
                </Link>
                <button
                  onClick={() => router.push('/inventory')}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = nookies.get(ctx);
  const token = cookies.auth_token;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, SECRET);
    
    const { id } = ctx.params!;
    const [rows] = await db.query('SELECT * FROM parts WHERE part_id = ?', [id]);
    const partData = rows[0];

    if (!partData) {
      return {
        notFound: true,
      };
    }

    // Proper serialization with null checks
    const serializedPart = {
      part_id: partData.part_id,
      name: partData.name || '',
      type: partData.type || '',
      stock_level: partData.stock_level || 0,
      description: partData.description || null,
      created_at: partData.created_at 
        ? (partData.created_at instanceof Date 
            ? partData.created_at.toISOString() 
            : String(partData.created_at))
        : null,
      updated_at: partData.updated_at 
        ? (partData.updated_at instanceof Date 
            ? partData.updated_at.toISOString() 
            : String(partData.updated_at))
        : null,
    };

    return {
      props: {
        part: serializedPart,
      },
    };
  } catch (err) {
    console.error('Error in getServerSideProps:', err);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default PartDetail;