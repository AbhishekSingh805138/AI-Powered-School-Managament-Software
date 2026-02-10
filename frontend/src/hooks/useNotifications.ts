import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NotificationData, User } from '@/types';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL!.replace('https://', 'wss://').replace('http://', 'ws://');

interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (user: User | null): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async (): Promise<void> => {
    try {
      const response = await axios.get<NotificationData[]>(`${BACKEND_URL}/api/notifications`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const connectWebSocket = (): void => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}/api/notifications/ws?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
        
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        
        (ws as any).pingInterval = pingInterval;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const notification: NotificationData = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          if (window.Notification.permission === 'granted') {
            new window.Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png'
            });
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();

      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }

    return () => {
      if (wsRef.current) {
        if ((wsRef.current as any).pingInterval) {
          clearInterval((wsRef.current as any).pingInterval);
        }
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications
  };
};
