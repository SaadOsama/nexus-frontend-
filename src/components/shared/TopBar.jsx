import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ChevronDown, LogOut, User } from 'lucide-react';
import NotificationBell from "../../../pages/user/Notifications/NotificationBell";
import { logout } from '@/redux/slices/userSlices';

export const TopBar = ({ journey = 'user', currentUserName = "Jordan Smith", onJourneyChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const initials = currentUserName
    ? currentUserName.split(' ').map((n) => n[0]).join('')
    : 'JS';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔴 Logout Function
  const handleLogout = () => {
    dispatch(logout()); // Redux state clear + localStorage clear (token, user, refreshToken sab)
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
        <NotificationBell />

        {/* Profile + Dropdown */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setProfileOpen((prev) => !prev)}
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