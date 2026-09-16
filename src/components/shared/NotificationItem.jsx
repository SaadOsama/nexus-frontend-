import React from 'react';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationItem = ({ message, onClick, isRead = true, createdAt }) => {
  return (
    <div
      onClick={onClick}
      className={`w-full rounded-2xl p-4 sm:p-5 border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-all flex items-center gap-3.5 cursor-pointer ${
        isRead ? 'bg-white border-slate-100' : 'bg-emerald-50/40 border-emerald-100'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isRead ? 'bg-slate-200' : 'bg-[#0f9f59]'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm leading-normal ${isRead ? 'font-medium text-slate-600' : 'font-semibold text-slate-800'}`}>
          {message}
        </p>
        {createdAt && (
          <p className="text-[10px] text-slate-400 mt-1">{timeAgo(createdAt)}</p>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
