import React, { useState, useEffect } from 'react';
import NotificationItem from '/src/components/shared/NotificationItem';
import api from '/src/api/axios.js';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleItemClick = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );

    try {
      await api.patch(`/notifications/${id}/read`);
      // 🟢 Dispatch event to sync TopBar badge instantly
      window.dispatchEvent(new Event('notification_updated'));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));

    try {
      await api.patch('/notifications/read-all');
      // 🟢 Dispatch event to sync TopBar badge instantly
      window.dispatchEvent(new Event('notification_updated'));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
            PROJECT NEXUS
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Your workspace for building meaningful things.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-[#0f9f59] hover:underline cursor-pointer shrink-0 pt-6"
          >
            Mark all as read
          </button>
        )}
      </div>

      <h2 className="text-sm font-bold text-slate-900 pt-2">
        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      </h2>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-slate-400">No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              message={item.message}
              isRead={Boolean(item.is_read)}
              createdAt={item.created_at}
              onClick={() => handleItemClick(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;