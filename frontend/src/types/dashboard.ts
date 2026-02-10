export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_assignments: number;
  present_today: number;
  pending_fees: number;
}

export interface School {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  is_active: boolean;
}

export interface SchoolCreate {
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
}
