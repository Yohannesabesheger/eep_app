import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { useEffect, useState } from 'react';
import { User, UserContext } from '@/context/UserContext';
import Layout from '@/components/layouts/Layout';
import jwt from 'jsonwebtoken';
import Cookies from 'js-cookie';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      try {
        const decoded = jwt.decode(token) as User;
        setUser(decoded);
      } catch {
        setUser(null);
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserContext.Provider>
  );
};

export default MyApp;

