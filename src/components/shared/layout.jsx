import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

import TopBar from './TopBar.jsx';
import Sidebar from './sidebar.jsx';

export default function Layout() {
  // 🟢 FIX: Redux store se logged-in user ka data nikal rahe hain
  const currentUser = useSelector((state) => state.user?.user);

  // 🟢 FIX: backend response mein field ka exact naam confirm nahi tha,
  // isliye common possibilities try kar rahe hain, warna fallback name
  const displayName =
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.username ||
    'Guest User';

  return (
    <div className="w-full flex bg-white font-sans min-h-screen">
      {/* Sidebar - full height, left side */}
      <Sidebar />

      {/* Right column: TopBar + Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar currentUserName={displayName} />

        <main className="flex-1 bg-white p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}