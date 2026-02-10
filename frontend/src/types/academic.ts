export interface Assignment {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  due_date: string;
  subject: string;
  teacher_id: string;
  grade: string;
  max_score: number;
  created_at: string;
}

export interface AssignmentCreate {
  title: string;
  description: string;
  due_date: string;
  subject: string;
  teacher_id: string;
  grade: string;
  max_score: number;
}

export interface Grade {
  id: string;
  tenant_id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  feedback?: string;
  created_at: string;
}

export interface GradeCreate {
  assignment_id: string;
  student_id: string;
  score: number;
  feedback?: string;
}
