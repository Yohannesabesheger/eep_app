import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { db } from '@/utils/db';
import { useRouter } from 'next/router';

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  status: 'Pending' | 'Resolved';
  part_id: number | null;
  risk_id: number | null;
  created_at: string;
}

interface NotificationsPageProps {
  notifications: Notification[];
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications: initialNotifications }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const router = useRouter();

  const handleMarkResolved = async (notificationId: number) => {
    try {
      const res = await fetch('/api/notifications/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark notification as resolved');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notificationId
            ? { ...notification, status: 'Resolved' }
            : notification
        )
      );
    } catch (error) {
      console.error('Error resolving notification:', error);
      alert('Failed to mark notification as resolved');
    }
  };

  const handleViewPart = (partId: number | null) => {
    if (partId) {
      router.push(`/inventory/${partId}`);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      Inventory: 'bg-blue-100 text-blue-800',
      Risk: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const pendingNotifications = notifications.filter(n => n.status === 'Pending');
  const resolvedNotifications = notifications.filter(n => n.status === 'Resolved');

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <div className="text-sm text-gray-600">
            {pendingNotifications.length} pending, {resolvedNotifications.length} resolved
          </div>
        </div>

        {/* Pending Notifications */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-yellow-700">Pending Notifications</h2>
          {pendingNotifications.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingNotifications.map((notification) => (
                    <tr key={notification.notification_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(notification.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {notification.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notification.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleMarkResolved(notification.notification_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Mark Resolved
                        </button>
                        {notification.part_id && (
                          <button
                            onClick={() => handleViewPart(notification.part_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Part
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No pending notifications
            </div>
          )}
        </div>

        {/* Resolved Notifications */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-700">Resolved Notifications</h2>
          {resolvedNotifications.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resolvedNotifications.map((notification) => (
                    <tr key={notification.notification_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(notification.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {notification.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notification.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No resolved notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<NotificationsPageProps> = async () => {
  const [results] = await db.query(`
    SELECT * FROM notifications 
    ORDER BY 
      CASE status 
        WHEN 'Pending' THEN 1 
        ELSE 2 
      END,
      created_at DESC
  `);

  const typedResults = results as {
    notification_id: number;
    type: string;
    message: string;
    status: string;
    part_id: number | null;
    risk_id: number | null;
    created_at: Date | string;
  }[];

  const notifications: Notification[] = typedResults.map((n) => ({
    notification_id: n.notification_id,
    type: n.type,
    message: n.message,
    status: n.status === 'Resolved' ? 'Resolved' : 'Pending',
    part_id: n.part_id,
    risk_id: n.risk_id,
    created_at: n.created_at instanceof Date ? n.created_at.toISOString() : String(n.created_at),
  }));

  return {
    props: {
      notifications,
    },
  };
};

export default NotificationsPage;