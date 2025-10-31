// File: /pages/risks/[id].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { db } from '@/utils/db';
import { Risk, Part } from '@/interfaces';
import Link from 'next/link';
import { useState } from 'react';

interface RiskDetailProps {
  risk: (Risk & { part_name?: string; created_at?: string; updated_at?: string }) | null;
}

const RiskDetailPage: React.FC<RiskDetailProps> = ({ risk }) => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (router.isFallback) {
    return <div className="p-6">Loading...</div>;
  }

  if (!risk) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Risk not found
        </div>
        <Link href="/risk-management" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Risk Management
        </Link>
      </div>
    );
  }

  const showNotification = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/risks/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riskId: risk.risk_id, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update risk status');
      }

      const { risk: updatedRisk } = await response.json();
      
      // Update the local risk data
      Object.assign(risk, updatedRisk);
      showNotification('Risk status updated successfully!');
      
      // Force a re-render
      router.replace(router.asPath);
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, true);
      } else {
        showNotification('An unknown error occurred', true);
      }
    }
  };

  const handleDeleteRisk = async () => {
    if (!confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/risks/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riskId: risk.risk_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete risk');
      }

      showNotification('Risk deleted successfully!');
      setTimeout(() => {
        router.push('/risk-management');
      }, 1000);
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
      Low: 'bg-green-100 text-green-800 border-green-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${severityClasses[severity as keyof typeof severityClasses] || 'bg-gray-100 text-gray-800'}`}>
        {severity}
      </span>
    );
  };

  const getLikelihoodBadge = (likelihood: string) => {
    const likelihoodClasses = {
      Low: 'bg-green-100 text-green-800 border-green-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      High: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${likelihoodClasses[likelihood as keyof typeof likelihoodClasses] || 'bg-gray-100 text-gray-800'}`}>
        {likelihood}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Open: 'bg-red-100 text-red-800 border-red-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Resolved: 'bg-green-100 text-green-800 border-green-200',
      Closed: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
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

  const riskScore = calculateRiskScore(risk.severity, risk.likelihood);
  const riskLevel = riskScore >= 9 ? 'Critical' : riskScore >= 6 ? 'High' : riskScore >= 4 ? 'Medium' : 'Low';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/risk-management" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Risk Management
          </Link>
          <h1 className="text-3xl font-bold">Risk Details</h1>
          <p className="text-gray-600">Risk ID: #{risk.risk_id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteRisk}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Delete Risk
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Overview Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Type</label>
                <p className="text-lg font-semibold">{risk.risk_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Part</label>
                <p className="text-lg font-semibold">{risk.part_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <div className="mt-1">{getSeverityBadge(risk.severity)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Likelihood</label>
                <div className="mt-1">{getLikelihoodBadge(risk.likelihood)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-bold ${
                    riskLevel === 'Critical' ? 'text-red-600' :
                    riskLevel === 'High' ? 'text-orange-600' :
                    riskLevel === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {riskScore}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                    riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                    riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {riskLevel} Risk
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="mt-1">
                  <select
                    value={risk.status || 'Open'}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${
                      (risk.status || 'Open') === 'Open' ? 'bg-red-100 text-red-800' :
                      (risk.status || 'Open') === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      (risk.status || 'Open') === 'Resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{risk.description}</p>
          </div>

          {/* Impact Card */}
          {risk.impact && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Impact</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{risk.impact}</p>
            </div>
          )}

          {/* Mitigation Plan Card */}
          {risk.mitigation_plan && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Mitigation Plan</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{risk.mitigation_plan}</p>
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-600">
                  {risk.created_at ? new Date(risk.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-600">
                  {risk.updated_at ? new Date(risk.updated_at).toLocaleString() : 
                   risk.created_at ? new Date(risk.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Matrix Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
            <div className="text-center">
              <div className="inline-grid grid-cols-4 gap-1 text-xs mb-4">
                <div className="p-2 bg-gray-100 font-semibold">Likelihood →<br />Severity ↓</div>
                <div className="p-2 bg-green-50 font-semibold">Low</div>
                <div className="p-2 bg-yellow-50 font-semibold">Medium</div>
                <div className="p-2 bg-red-50 font-semibold">High</div>
                
                <div className="p-2 bg-green-50 font-semibold">Low</div>
                <div className="p-2 bg-green-200">1</div>
                <div className="p-2 bg-yellow-200">2</div>
                <div className="p-2 bg-orange-200">3</div>
                
                <div className="p-2 bg-yellow-50 font-semibold">Medium</div>
                <div className="p-2 bg-yellow-200">2</div>
                <div className="p-2 bg-orange-200">4</div>
                <div className="p-2 bg-red-200">6</div>
                
                <div className="p-2 bg-orange-50 font-semibold">High</div>
                <div className="p-2 bg-orange-200">3</div>
                <div className="p-2 bg-red-200">6</div>
                <div className="p-2 bg-red-300">9</div>
                
                <div className="p-2 bg-red-50 font-semibold">Critical</div>
                <div className="p-2 bg-orange-200">4</div>
                <div className="p-2 bg-red-300">8</div>
                <div className="p-2 bg-red-400 text-white">12</div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="font-semibold">Current Risk Position</p>
                <p className="text-sm text-gray-600">
                  Severity: {risk.severity} × Likelihood: {risk.likelihood} = Score: {riskScore}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('In Progress')}
                disabled={risk.status === 'In Progress'}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus('Resolved')}
                disabled={risk.status === 'Resolved'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus('Closed')}
                disabled={risk.status === 'Closed'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Close Risk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  try {
    const [risks] = await db.query(
      `SELECT r.*, p.name AS part_name 
       FROM risks r 
       LEFT JOIN parts p ON r.part_id = p.part_id 
       WHERE r.risk_id = ?`,
      [id]
    );

    const riskArray = risks as any[];
    
    if (!Array.isArray(riskArray) || riskArray.length === 0) {
      return {
        props: {
          risk: null,
        },
      };
    }

    const risk = riskArray[0];
    
    // Convert Date fields to strings for serialization
    const riskSerialized = {
      ...risk,
      created_at: risk.created_at ? risk.created_at.toISOString() : null,
      updated_at: risk.updated_at ? risk.updated_at.toISOString() : null,
    };

    return {
      props: {
        risk: JSON.parse(JSON.stringify(riskSerialized)),
      },
    };
  } catch (error) {
    console.error('Error fetching risk:', error);
    return {
      props: {
        risk: null,
      },
    };
  }
};

export default RiskDetailPage;