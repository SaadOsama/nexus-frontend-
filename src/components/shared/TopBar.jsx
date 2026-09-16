import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ChevronDown, Bell, LogOut, User } from 'lucide-react';
import NotificationItem from '/src/components/shared/NotificationItem';
import { logout } from '@/redux/slices/userSlices';
import api from '/src/api/axios.js';

export const TopBar = ({ journey = 'user', currentUserName = "Jordan Smith", onJourneyChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // 🟢 Real notification state — replaces the hardcoded notificationData array
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const initials = currentUserName
    ? currentUserName.split(' ').map((n) => n[0]).join('')
    : 'JS';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🟢 Fetch unread count on mount, then poll every 30s so the badge stays
  // fresh even if the user never opens the dropdown.
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread notification count', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🟢 Fetch the actual notification list only when the dropdown is opened
  // (no point loading it on every page load if the user never checks it).
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications((response.data.notifications || []).slice(0, 6));
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleBellClick = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setProfileOpen(false);
    if (opening) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifOpen(false);

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // 🔴 Logout Function
  const handleLogout = () => {
    dispatch(logout());          // Redux state clear + localStorage clear (token, user, refreshToken sab)
    setProfileOpen(false);
    navigate('/login', { replace: true }); // Login page par redirect karein
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between select-none shrink-0 font-sans relative">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-400">Workspace</span>
        <span className="text-sm text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-500 capitalize">
          {journey === 'admin' ? 'Admin Panel' : 'Overview'}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Notification Bell + Dropdown */}
        <div className="relative" ref={notifRef}>
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

          {notifOpen && (
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
                      onClick={() => handleNotificationClick(item.id)}
                    />
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate('/notifications');
                  setNotifOpen(false);
                }}
                className="w-full text-center text-xs font-semibold text-[#0f9f59] py-2.5 border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile + Dropdown */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
              {currentUserName}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </div>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              <button
                type="button"
                onClick={() => {
                  navigate('/profile');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile Overview
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
