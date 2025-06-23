import { GetServerSideProps } from 'next';
import { db } from '@/utils/db';

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  status: 'Pending' | 'Resolved';
  created_at: string;
}

interface NotificationsPageProps {
  notifications: Notification[];
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications }) => {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Notification Center</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Type</th>
            <th>Message</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => (
            <tr key={n.notification_id} className="border-t">
              <td>{n.type}</td>
              <td>{n.message}</td>
              <td className={n.status === 'Resolved' ? 'text-green-600' : 'text-red-600'}>
                {n.status}
              </td>
              <td>{new Date(n.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<NotificationsPageProps> = async () => {
  const [results] = await db.query('SELECT * FROM notifications');

  // Correctly assert the shape of the result
  const typedResults = results as {
    notification_id: number;
    type: string;
    message: string;
    status: string;
    created_at: Date | string;
  }[];

  const notifications: Notification[] = typedResults.map((n) => ({
    notification_id: n.notification_id,
    type: n.type,
    message: n.message,
    status: n.status === 'Resolved' ? 'Resolved' : 'Pending',
    created_at: n.created_at instanceof Date ? n.created_at.toISOString() : String(n.created_at),
  }));

  return {
    props: {
      notifications,
    },
  };
};

export default NotificationsPage;
