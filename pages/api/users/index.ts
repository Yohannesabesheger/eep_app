import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

// Define a type for user data
interface User {
  user_id: number;
  name: string;
  company_id: string;
  role: 'Admin' | 'Warehouse Staff' | 'Maintenance Staff';
  status: boolean;
  email: string | null;
}

type Data = User | User[] | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
): Promise<void> {
  try {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT user_id, name, company_id, role, status, email FROM users');
      return res.status(200).json(rows as User[]);
    }

    if (req.method === 'POST') {
      const { name, company_id, role, status, email, password_hash } = req.body;

      // Basic validation
      if (!name || !company_id || !role || !password_hash) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Insert user
      const [result]: any = await db.query(
        'INSERT INTO users (name, company_id, role, status, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [name, company_id, role, status ?? true, email ?? null, password_hash]
      );

      const insertId: number = result.insertId;

      // Fetch the newly created user
      const [newUserRows] = await db.query(
        'SELECT user_id, name, company_id, role, status, email FROM users WHERE user_id = ?',
        [insertId]
      );

      const user = (newUserRows as User[])[0];
      return res.status(201).json(user);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
