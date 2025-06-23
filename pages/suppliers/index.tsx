import { GetServerSideProps } from 'next';
import { db } from '@/utils/db';

interface Supplier {
  supplier_id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  performance_rating: number;
  lead_time_days: number;
}

interface SuppliersPageProps {
  suppliers: Supplier[];
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Rating</th>
            <th>Lead Time (Days)</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.supplier_id} className="border-t">
              <td>{s.name}</td>
              <td>{s.contact_email}</td>
              <td>{s.contact_phone}</td>
              <td>{s.performance_rating}</td>
              <td>{s.lead_time_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [suppliers] = await db.query('SELECT * FROM suppliers');
  return {
    props: {
      suppliers,
    },
  };
};

export default SuppliersPage;
