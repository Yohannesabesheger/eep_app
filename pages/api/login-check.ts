import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '@/utils/db';
import type { RowDataPacket } from 'mysql2';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface UserRow extends RowDataPacket {
  name: string;
  role: string;
  password_hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Only POST allowed' });

  const { username, password } = req.body;

  try {
    const [rows] = await db.query<UserRow[]>(
      'SELECT * FROM users WHERE company_id = ? OR email = ?',
      [username, username]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '1d' });

    return res.status(200).json({ token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
