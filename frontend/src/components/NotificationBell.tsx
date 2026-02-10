import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../App';
import { Notification } from '@/types';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(user);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      assignment: '📚',
      fee: '💰',
      attendance: '📅',
      system: '🔔'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        data-testid="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#F5F5F0] rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-[#52525B]" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-count"
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            data-testid="notification-dropdown"
            className="absolute right-0 mt-2 w-96 bg-white border border-[#0F2F24]/10 rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col"
          >
            <div className="p-4 border-b border-[#0F2F24]/10 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#0F2F24]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  data-testid="mark-all-read"
                  onClick={markAllAsRead}
                  className="text-sm text-[#7C3AED] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#52525B]">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-[#A1A1AA]" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#0F2F24]/10">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      data-testid={`notification-item-${notification.id}`}
                      className={`p-4 hover:bg-[#F5F5F0] transition-colors ${
                        !notification.read ? 'bg-[#7C3AED]/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-[#0F2F24] text-sm">
                              {notification.title}
                            </h4>
                            <button
                              data-testid={`delete-notification-${notification.id}`}
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-white rounded transition-colors ml-2"
                            >
                              <X className="w-4 h-4 text-[#A1A1AA]" />
                            </button>
                          </div>
                          <p className="text-sm text-[#52525B] mb-2">{notification.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[#A1A1AA]">
                              {formatTime(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <button
                                data-testid={`mark-read-${notification.id}`}
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
