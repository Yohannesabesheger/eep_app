// Part item
export interface Part {
  part_id: number;
  name: string;
  type: string;
  location: string;
  stock_level: number;
  min_threshold: number;
  max_threshold: number;
  supplier_id: number | null;
  image_url: string | null;
  status: 'Available' | 'Low' | 'Critical';
}
export interface User {
  user_id: number;
  name: string;
  company_id: string;
  role: string;
  status: number;
  email: string;
  password_hash: string;
}
export interface DashboardProps {
  parts: Part[];
}
// Supplier
export interface Supplier {
  supplier_id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  performance_rating: number;
  lead_time_days: number;
}

// Risk
export interface Risk {
  risk_id: number;
  part_id: number;
  risk_type: string;
  severity: 'Low' | 'Medium' | 'High';
  likelihood: number;
  status: 'Open' | 'Acknowledged' | 'Resolved';
  created_at: string;
}

// Notification
export interface Notification {
  notification_id: number;
  type: 'Inventory' | 'Risk';
  message: string;
  status: 'Pending' | 'Resolved';
  part_id: number | null;
  risk_id: number | null;
  created_at: string;
}

// Button component props
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
}

// Layout component props
export interface LayoutProps {
  children: React.ReactNode;
}

export interface Part {
  part_id: number;
  name: string;
  // ...other fields
}

export interface PartOrder {
  order_id: number;
  part_id: number;
  quantity: number;
  status: string;
  created_at: string | Date;}
  // Add other fields