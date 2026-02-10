import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const connectWebSocket = () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/notifications?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        
        ws.pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png'
            });
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }
        
        // Attempt to reconnect after 5 seconds
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

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
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

  const markAllAsRead = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
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
