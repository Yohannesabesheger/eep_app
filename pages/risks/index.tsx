// File: /pages/risk-management.tsx - Risk Management Page
import { GetServerSideProps } from 'next';
import { db } from '@/utils/db';
import { Risk, Part } from '@/interfaces';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface RiskManagementProps {
  risks: (Risk & { part_name?: string; created_at?: string })[];
  parts: Part[];
}

const RiskManagementPage: React.FC<RiskManagementProps> = ({ risks: initialRisks, parts }) => {
  const [risks, setRisks] = useState(initialRisks);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [newRisk, setNewRisk] = useState({
    part_id: 0,
    risk_type: '',
    description: '',
    severity: 'Medium',
    likelihood: 'Medium',
    impact: '',
    mitigation_plan: '',
    status: 'Open'
  });

  const showNotification = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/risks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRisk),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create risk');
      }

      const { risk, notificationCreated } = await response.json();
      
      setRisks(prev => [risk, ...prev]);
      setShowCreateForm(false);
      setNewRisk({
        part_id: 0,
        risk_type: '',
        description: '',
        severity: 'Medium',
        likelihood: 'Medium',
        impact: '',
        mitigation_plan: '',
        status: 'Open'
      });

      if (notificationCreated) {
        showNotification('Risk created successfully and notification generated!');
      } else {
        showNotification('Risk created successfully!');
      }
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRisk = async (riskId: number) => {
    if (!confirm('Are you sure you want to delete this risk?')) {
      return;
    }

    try {
      const response = await fetch('/api/risks/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete risk');
      }

      setRisks(prev => prev.filter(risk => risk.risk_id !== riskId));
      showNotification('Risk deleted successfully!');
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const handleUpdateStatus = async (riskId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/risks/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riskId, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update risk status');
      }

      const { risk: updatedRisk } = await response.json();
      
      setRisks(prev =>
        prev.map(risk =>
          risk.risk_id === riskId ? { ...risk, status: updatedRisk.status } : risk
        )
      );
      
      showNotification('Risk status updated successfully!');
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityClasses = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityClasses[severity as keyof typeof severityClasses] || 'bg-gray-100 text-gray-800'}`}>
        {severity}
      </span>
    );
  };

  const getLikelihoodBadge = (likelihood: string) => {
    const likelihoodClasses = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${likelihoodClasses[likelihood as keyof typeof likelihoodClasses] || 'bg-gray-100 text-gray-800'}`}>
        {likelihood}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Open: 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800',
      Closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const calculateRiskScore = (severity: string, likelihood: string) => {
    const severityScores = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    const likelihoodScores = { Low: 1, Medium: 2, High: 3 };
    
    return (severityScores[severity as keyof typeof severityScores] || 1) * 
           (likelihoodScores[likelihood as keyof typeof likelihoodScores] || 1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Risk Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Risk
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Create Risk Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Risk</h2>
            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Part</label>
                  <select
                    name="part_id"
                    value={newRisk.part_id}
                    onChange={(e) => setNewRisk({ ...newRisk, part_id: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value={0}>Select a part</option>
                    {parts.map((part) => (
                      <option key={part.part_id} value={part.part_id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Risk Type</label>
                  <select
                    name="risk_type"
                    value={newRisk.risk_type}
                    onChange={(e) => setNewRisk({ ...newRisk, risk_type: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select risk type</option>
                    <option value="Supply Chain">Supply Chain</option>
                    <option value="Quality">Quality</option>
                    <option value="Operational">Operational</option>
                    <option value="Financial">Financial</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    name="severity"
                    value={newRisk.severity}
                    onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Likelihood</label>
                  <select
                    name="likelihood"
                    value={newRisk.likelihood}
                    onChange={(e) => setNewRisk({ ...newRisk, likelihood: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Impact</label>
                <textarea
                  name="impact"
                  value={newRisk.impact}
                  onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mitigation Plan</label>
                <textarea
                  name="mitigation_plan"
                  value={newRisk.mitigation_plan}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigation_plan: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Risk'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likelihood</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {risks.map((risk) => {
              const riskScore = calculateRiskScore(risk.severity, risk.likelihood);
              return (
                <tr key={risk.risk_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{risk.risk_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.part_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.risk_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSeverityBadge(risk.severity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLikelihoodBadge(risk.likelihood)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      riskScore >= 9 ? 'bg-red-100 text-red-800' :
                      riskScore >= 6 ? 'bg-orange-100 text-orange-800' :
                      riskScore >= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {riskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={risk.status}
                      onChange={(e) => handleUpdateStatus(risk.risk_id, e.target.value)}
                      className={`text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                        risk.status === 'Open' ? 'bg-red-100 text-red-800' :
                        risk.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        risk.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {risk.created_at ? new Date(risk.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/risks/${risk.risk_id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteRisk(risk.risk_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {risks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No risks found. Create your first risk above.
          </div>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [risks] = await db.query(
    `SELECT r.*, p.name AS part_name 
     FROM risks r 
     LEFT JOIN parts p ON r.part_id = p.part_id
     ORDER BY r.created_at DESC`
  );

  const [parts] = await db.query('SELECT * FROM parts');

  const risksSerialized = (risks as (Risk & { part_name?: string; created_at?: Date })[]).map((risk) => ({
    ...risk,
    created_at: risk.created_at ? risk.created_at.toISOString() : null,
  }));

  return {
    props: {
      risks: JSON.parse(JSON.stringify(risksSerialized)),
      parts: JSON.parse(JSON.stringify(parts)),
    },
  };
};

export default RiskManagementPage;