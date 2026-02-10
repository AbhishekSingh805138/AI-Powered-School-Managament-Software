export interface Student {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
  date_of_birth: string;
  parent_email?: string;
  created_at: string;
  is_active: boolean;
}

export interface StudentCreate {
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
  date_of_birth: string;
  parent_email?: string;
}

export interface Teacher {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subjects: string[];
  qualification: string;
  created_at: string;
  is_active: boolean;
}

export interface TeacherCreate {
  first_name: string;
  last_name: string;
  email: string;
  subjects: string[];
  qualification: string;
}
