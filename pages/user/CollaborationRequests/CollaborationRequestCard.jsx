import React from 'react';

export default function CollaborationRequestCard({ request, onAccept, onDismiss, onOpenDetail }) {
  return (
    <div
      onClick={() => onOpenDetail(request)}
      className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-xs hover:border-slate-200 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#0f9f59]/10 text-[#0f9f59] flex items-center justify-center font-bold text-sm">
          {request.senderName ? request.senderName[0] : 'U'}
        </div>
        <div>
          <p className="text-sm text-slate-800 font-medium">
            <span className="font-semibold text-slate-900">{request.senderName}</span> {request.actionText}{' '}
            <span className="font-semibold text-[#0f9f59]">{request.targetName}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(request.id);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept(request.id);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#00a664] hover:bg-[#0f9f59] rounded-xl transition cursor-pointer"
        >
          Accept
        </button>
      </div>
    </div>
  );
}