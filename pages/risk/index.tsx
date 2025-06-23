import { GetServerSideProps } from 'next';
import { db } from '@/utils/db';

interface Risk {
  risk_id: number;
  part_id: number;
  risk_type: string;
  severity: 'Low' | 'Medium' | 'High';
  likelihood: number;
  status: string;
  created_at: string;
}

interface RisksPageProps {
  risks: Risk[];
}

const RisksPage: React.FC<RisksPageProps> = ({ risks }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Risk Overview</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Risk Type</th>
            <th>Severity</th>
            <th>Likelihood</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr key={risk.risk_id} className="border-t">
              <td>{risk.risk_type}</td>
              <td className={`font-bold ${risk.severity === 'High' ? 'text-red-600' : risk.severity === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                {risk.severity}
              </td>
              <td>{risk.likelihood}</td>
              <td>{risk.status}</td>
              <td>{new Date(risk.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [risks] = await db.query('SELECT * FROM risks');
  return {
    props: {
      risks,
    },
  };
};

export default RisksPage;
