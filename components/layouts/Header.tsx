import Link from 'next/link';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useUser } from '@/context/UserContext';
import { useState, useEffect, useRef } from 'react';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [isPartsMenuOpen, setIsPartsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    setUser(null);
    router.push('/login');
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsPartsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-blue-900 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center relative">
        <h1 className="text-xl font-bold">EEP Inventory System</h1>

        {user ? (
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-4 relative" ref={dropdownRef}>
              <Link href="/" className="hover:text-gray-300">
                Dashboard
              </Link>

              {/* Parts dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsPartsMenuOpen(!isPartsMenuOpen)}
                  className="hover:text-gray-300 focus:outline-none"
                >
                  Parts ▾
                </button>
                {isPartsMenuOpen && (
                  <div className="absolute top-full left-0 bg-white text-black mt-2 rounded shadow w-40 z-50">
                    <Link
                      href="/inventory"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsPartsMenuOpen(false)}
                    >
                      Inventory
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsPartsMenuOpen(false)}
                    >
                      Order Parts
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/suppliers" className="hover:text-gray-300">
                Suppliers
              </Link>
              <Link href="/risks" className="hover:text-gray-300">
                Risk Management
              </Link>
              <Link href="/notifications" className="hover:text-gray-300">
                Notifications
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <span>
                Welcome, <strong>{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Link href="/login" className="text-blue-300 hover:text-white">
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
