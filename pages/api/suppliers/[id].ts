import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      // Check if supplier exists
      const [suppliers] = await db.query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
      
      if (!Array.isArray(suppliers) || suppliers.length === 0) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      // Delete the supplier
      await db.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);

      res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: 'Failed to delete supplier' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}