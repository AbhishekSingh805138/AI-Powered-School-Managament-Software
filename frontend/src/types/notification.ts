export interface NotificationData {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'fee' | 'attendance' | 'system';
  user_id: string;
  read: boolean;
  created_at: string;
}

export interface ChatMessage {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}
