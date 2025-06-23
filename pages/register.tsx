// File: /pages/register.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '@/components/commons/Button';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Warehouse Staff');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, companyId, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Registration failed');
        return;
      }

      alert('Account created!');
      router.push('/login');
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-6 text-center">Create New Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 border rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Company ID"
          className="w-full p-2 border rounded mb-3"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Admin</option>
          <option>Warehouse Staff</option>
          <option>Maintenance Staff</option>
        </select>

        <Button onClick={handleRegister}>
          {isLoading ? 'Creating...' : 'Register'}
        </Button>

        <p className="text-sm mt-4 text-center">
          Already have an account?
          <Link href="/login" className="text-blue-600 ml-1 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
