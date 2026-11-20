import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, LogOut, User } from 'lucide-react';
import NotificationBell from "../../../pages/user/Notifications/NotificationBell";
import { logout } from '@/redux/slices/userSlices';
import Breadcrumb from '@/components/Breadcrumb';
import { getInitials } from '@/utils/getInitials';

export const TopBar = ({ journey = 'user', currentUserName, onJourneyChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Naam logged-in profile se: pehle Redux, phir localStorage, phir prop
  const reduxUser = useSelector((state) => state.user?.user ?? state.user?.currentUser ?? null);
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('nexus_user'));
  } catch {
    storedUser = null;
  }
  const displayName = reduxUser?.name || storedUser?.name || currentUserName || 'User';
  const initials = getInitials(displayName);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout()); // Redux state clear + localStorage clear (token, user, refreshToken sab)
    setProfileOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between select-none shrink-0 font-sans relative">
      <Breadcrumb />

      <div className="flex items-center gap-5">
        <NotificationBell />

        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
              {displayName}
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