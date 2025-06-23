// File: /pages/forgot-password.tsx - Password Reset Page

import { useState } from 'react';
import Button from '@/components/commons/Button';
import Link from 'next/link';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-6 text-center">Reset Password</h2>

        {submitted ? (
          <p className="text-green-600 text-center">Check your email for reset instructions.</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-2 border rounded mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleSubmit}>Send Reset Link</Button>
          </>
        )}

        <p className="text-sm mt-4 text-center">
          Return to
          <Link href="/login" className="text-blue-600 ml-1 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;