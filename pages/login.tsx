import { useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useUser } from '@/context/UserContext';
import Button from '@/components/commons/Button';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setUser } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid credentials');
      }

      const { token, user } = await res.json();
      Cookies.set('auth_token', token, { expires: 1 }); // 1 day expiry
      setUser(user);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-6 text-center">Login to EEP Inventory</h2>

        {error && (
          <p className="text-red-600 mb-4 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Username or Email"
          className="w-full p-2 border rounded mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <Button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="mt-4 text-sm text-center space-y-2">
          <Link href="/forgot-password" className="text-blue-600 hover:underline block">
            Forgot Password?
          </Link>
          <span className="text-gray-500">Don&apos;t have an account?</span>
          <Link href="/register" className="text-blue-600 hover:underline block">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
