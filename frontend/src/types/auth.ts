export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  tenant_id: string | null;
  created_at: string;
  is_active: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: string;
  tenant_id?: string | null;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
