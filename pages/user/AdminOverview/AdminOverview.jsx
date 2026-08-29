import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

function AdminOverview({ onExit }) {
  const handleExit = () => {
    if (onExit) onExit();
    else window.location.href = '/';
  };

  const stats = [
    { value: '1,248', label: 'Registered users' },
    { value: '86', label: 'Active projects' },
    { value: '42', label: 'Pending reviews' },
    { value: '94%', label: 'Trust score' },
  ];

  const moderationQueue = [
    { id: 1, title: 'OpenGrid Energy', type: 'New project' },
    { id: 2, title: 'Mindful Campus', type: 'Profile update' },
    { id: 3, title: 'Northstar Grid', type: 'Collaboration report' },
  ];

  const recentActivities = [
    { id: 1, text: '32 new projects this week' },
    { id: 2, text: '18 users completed profiles' },
    { id: 3, text: '7 projects reached team capacity' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fbfcfd] font-sans overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

        {/* Top bar */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Project Nexus
              </h2>
              <p className="truncate text-[11px] sm:text-xs text-slate-400">Innovation ecosystem</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
          >
            Exit admin
          </button>
        </header>

        {/* Title */}
        <div className="space-y-1.5 pt-1 sm:pt-2">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 stroke-[2.2]" />
            <span className="truncate">Super admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 break-words">
            Platform overview
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="min-w-0 space-y-1 sm:space-y-2 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="truncate text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                {stat.value}
              </div>
              <div className="text-[11px] sm:text-sm leading-snug text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Moderation queue */}
          <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Moderation queue</h3>
            <div className="space-y-3">
              {moderationQueue.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4"
                >
                  <p className="min-w-0 break-words text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{item.title}</span>
                    <span className="text-slate-400"> · {item.type}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => console.log('Review item:', item.title)}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent activity */}
          <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent platform activity</h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4"
                >
                  <p className="min-w-0 break-words text-xs sm:text-sm text-slate-700">{activity.text}</p>
                  <button
                    type="button"
                    onClick={() => console.log('Review activity:', activity.id)}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
