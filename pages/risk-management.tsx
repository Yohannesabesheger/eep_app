// File: /pages/risk-management.tsx - Risk Management Page

import { GetServerSideProps } from 'next';
import Layout from '@/components/layouts/Layout';
import { db } from '@/utils/db';
import { Risk } from '@/interfaces';
import Link from 'next/link';

interface RiskManagementProps {
  risks: (Risk & { part_name?: string; created_at?: string })[];
}

const RiskManagementPage: React.FC<RiskManagementProps> = ({ risks }) => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Risk Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>ID</th>
              <th>Part</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Likelihood</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk.risk_id} className="border-t">
                <td>{risk.risk_id}</td>
                <td>{risk.part_name || 'N/A'}</td>
                <td>{risk.risk_type}</td>
                <td>
                  <span
                    className={`font-semibold ${
                      risk.severity === 'High'
                        ? 'text-red-500'
                        : risk.severity === 'Medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  >
                    {risk.severity}
                  </span>
                </td>
                <td>{risk.likelihood}</td>
                <td>{risk.status}</td>
                <td>{risk.created_at ? new Date(risk.created_at).toLocaleString() : 'N/A'}</td>
                <td>
                  <Link
                    href={`/risks/${risk.risk_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Plan
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [risks] = await db.query(
    `SELECT r.*, p.name AS part_name 
     FROM risks r 
     LEFT JOIN parts p ON r.part_id = p.part_id`
  );

  // Convert Date fields to strings for serialization
  const risksSerialized = (risks as (Risk & { part_name?: string; created_at?: Date })[]).map((risk) => ({
    ...risk,
    created_at: risk.created_at ? risk.created_at.toISOString() : null,
  }));

  return {
    props: {
      risks: risksSerialized,
    },
  };
};

export default RiskManagementPage;
