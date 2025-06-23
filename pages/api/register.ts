// File: /pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';

// Define User interface extending RowDataPacket to type query result rows
interface User extends RowDataPacket {
  user_id: number;
  name: string;
  company_id: string;
  email: string;
  role: string;
  status: boolean;
  password_hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, companyId, email, password, role } = req.body;

  if (!name || !companyId || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Query existing users by companyId or email
    const [existing] = await db.query<User[]>(
      'SELECT * FROM users WHERE company_id = ? OR email = ?',
      [companyId, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'User with this Company ID or Email already exists' });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user record
    await db.query(
      'INSERT INTO users (name, company_id, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, companyId, email, hashedPassword, role, true]
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
