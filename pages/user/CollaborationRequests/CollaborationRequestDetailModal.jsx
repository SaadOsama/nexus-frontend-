import React from 'react';
import { X } from 'lucide-react';

export default function CollaborationRequestDetailModal({ isOpen, onClose, request, onAccept, onDismiss }) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0f9f59]/10 text-[#0f9f59] flex items-center justify-center font-bold text-sm">
            {request.senderName ? request.senderName[0] : 'U'}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{request.senderName}</h2>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {request.actionText} <span className="font-semibold text-[#0f9f59]">{request.targetName}</span>
        </p>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Email</p>
            <p className="text-sm text-slate-800">{request.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Message</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{request.message || 'No message provided'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onDismiss(request.id);
              onClose();
            }}
            className="flex-1 py-2 text-xs font-semibold border rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept(request.id);
              onClose();
            }}
            className="flex-1 py-2 text-xs font-semibold text-white bg-[#00a664] hover:bg-[#0f9f59] rounded-xl cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}