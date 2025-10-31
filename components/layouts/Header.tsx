import Link from 'next/link';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useUser } from '@/context/UserContext';
import { useState, useEffect, useRef } from 'react';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [isPartsMenuOpen, setIsPartsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    setUser(null);
    router.push('/login');
  };

  // Close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsPartsMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if a link is active
  const isActive = (path: string) => {
    return router.pathname === path;
  };

  // Get user role display name
  const getUserRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'Admin': 'Administrator',
      'Warehouse Staff': 'Warehouse Staff',
      'Maintenance Staff': 'Maintenance Staff'
    };
    return roleMap[role] || role;
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const roleClasses = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Warehouse Staff': 'bg-blue-100 text-blue-800',
      'Maintenance Staff': 'bg-green-100 text-green-800'
    };
    return roleClasses[role as keyof typeof roleClasses] || 'bg-gray-100 text-gray-800';
  };

  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-800 font-bold text-sm">EEP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Inventory System</h1>
              <p className="text-blue-200 text-xs">Enterprise Resource Planning</p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center space-x-6">
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
                <Link 
                  href="/" 
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive('/') 
                      ? 'bg-blue-700 text-white shadow-inner' 
                      : 'hover:bg-blue-700/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Dashboard</span>
                  </div>
                </Link>

                {/* Parts dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsPartsMenuOpen(!isPartsMenuOpen)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      (isActive('/inventory') || isActive('/orders')) 
                        ? 'bg-blue-700 text-white shadow-inner' 
                        : 'hover:bg-blue-700/50 hover:text-white'
                    }`}
                  >
                    <span>🔧</span>
                    <span>Parts</span>
                    <span className={`transform transition-transform ${isPartsMenuOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {isPartsMenuOpen && (
                    <div className="absolute top-full left-0 bg-white text-gray-800 mt-2 rounded-lg shadow-xl border border-gray-200 w-48 z-50 overflow-hidden">
                      <Link
                        href="/inventory"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        onClick={() => setIsPartsMenuOpen(false)}
                      >
                        <span>📦</span>
                        <span>Inventory Management</span>
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsPartsMenuOpen(false)}
                      >
                        <span>🛒</span>
                        <span>Order Parts</span>
                      </Link>
                    </div>
                  )}
                </div>

                <Link 
                  href="/suppliers" 
                  className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActive('/suppliers') 
                      ? 'bg-blue-700 text-white shadow-inner' 
                      : 'hover:bg-blue-700/50 hover:text-white'
                  }`}
                >
                  <span>🏢</span>
                  <span>Suppliers</span>
                </Link>

                <Link 
                  href="/risks" 
                  className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActive('/risk-management') 
                      ? 'bg-blue-700 text-white shadow-inner' 
                      : 'hover:bg-blue-700/50 hover:text-white'
                  }`}
                >
                  <span>⚠️</span>
                  <span>Risk Management</span>
                </Link>

                <Link 
                  href="/notifications" 
                  className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 relative ${
                    isActive('/notifications') 
                      ? 'bg-blue-700 text-white shadow-inner' 
                      : 'hover:bg-blue-700/50 hover:text-white'
                  }`}
                >
                  <span>🔔</span>
                  <span>Notifications</span>
                  {/* You can add a notification badge here later */}
                </Link>
              </nav>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 bg-blue-700/30 hover:bg-blue-700/50 rounded-lg px-3 py-2 transition-all duration-200 border border-blue-600/30"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-blue-200">{user.company_id}</div>
                  </div>
                  <span className={`transform transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 bg-white text-gray-800 mt-2 rounded-lg shadow-xl border border-gray-200 w-64 z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="font-semibold text-lg">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                          {getUserRoleDisplay(user.role)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {user.company_id}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Add profile page navigation here if needed
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>👤</span>
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Add settings page navigation here if needed
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-left rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="bg-white text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors shadow-sm"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation (simplified) */}
        {user && (
          <div className="md:hidden border-t border-blue-700 pt-2 mt-2">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              <Link href="/" className="text-sm whitespace-nowrap">Dashboard</Link>
              <Link href="/inventory" className="text-sm whitespace-nowrap">Inventory</Link>
              <Link href="/orders" className="text-sm whitespace-nowrap">Orders</Link>
              <Link href="/suppliers" className="text-sm whitespace-nowrap">Suppliers</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;