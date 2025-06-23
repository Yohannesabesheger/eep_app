// File: /pages/index.tsx - Dashboard (Main Panel)

import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { db } from '@/utils/db';
import { DashboardProps, Part } from '@/interfaces';
import nookies from 'nookies';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

const Home: React.FC<DashboardProps> = ({ parts }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parts.map((part) => (
          <div key={part.part_id} className="p-4 border rounded shadow">
            <h2 className="font-semibold text-lg">{part.name}</h2>
            <p>Type: {part.type}</p>
            <p>Stock: {part.stock_level}</p>
            <p>
              Status:{' '}
              <span
                className={`font-bold ${
                  part.status === 'Critical'
                    ? 'text-red-500'
                    : part.status === 'Low'
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              >
                {part.status}
              </span>
            </p>
            <Link href={`/inventory/${part.part_id}`} className="text-blue-600 underline mt-2 inline-block">
              View Details
            </Link>
          </div>
        ))}
      </div>
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
    const [rows] = await db.query('SELECT * FROM parts');
    return {
      props: {
        parts: rows,
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
