import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import NotificationItem from '/src/components/shared/NotificationItem';
import api from '/src/api/axios.js';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications((listRes.data.notifications || []).slice(0, 5));
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    window.addEventListener('notification_updated', fetchAll);
    const interval = setInterval(fetchAll, 30000);
    return () => {
      window.removeEventListener('notification_updated', fetchAll);
      clearInterval(interval);
    };
  }, [fetchAll]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    const opening = !open;
    setOpen(opening);
    if (opening) fetchAll();
  };

  const handleItemClick = async (item) => {
    setOpen(false);
    if (item.is_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${item.id}/read`);
      window.dispatchEvent(new Event('notification_updated'));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      fetchAll();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleBellClick}
        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors relative cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#0f9f59] rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  message={item.message}
                  isRead={Boolean(item.is_read)}
                  createdAt={item.created_at}
                  onClick={() => handleItemClick(item)}
                />
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              navigate('/notifications');
              setOpen(false);
            }}
            className="w-full text-center text-xs font-semibold text-[#0f9f59] py-2.5 border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;