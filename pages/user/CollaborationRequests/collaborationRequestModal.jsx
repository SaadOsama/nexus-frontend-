import React, { useState } from 'react';
import { CheckCircle2, X, Lock } from 'lucide-react';
import { useSendCollaborationRequest } from "@/api/client/collaborations";

export default function CollaborationRequestModal({ isOpen, onClose, project, onRequestSent }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const { mutateAsync: sendRequest, isPending: loading } = useSendCollaborationRequest();
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setEmail('');
    setMessage('');
    setStatus(null);
    setStatusMessage('');
    onClose();
  };

  if (project?.isOwner || project?.hasRequested) {
    const reason = project?.isOwner
      ? "You can't send a collaboration request on your own project."
      : "You've already sent a request for this project.";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">Can't send request</h2>
          <p className="text-sm text-slate-500 mb-6">{reason}</p>
          <button type="button" onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-slate-800 hover:opacity-90 transition cursor-pointer">
            OK
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      await sendRequest({ project_id: project.id, email, message });
      setStatus('success');
      setStatusMessage('Your collaboration request has been sent successfully.');
      if (onRequestSent) onRequestSent();
    } catch (err) {
      setStatus('error');
      setStatusMessage(err?.response?.data?.message || 'Failed to send request. Please try again.');
    }
  };

  if (status === 'success' || status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative">
          <button type="button" onClick={resetAndClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>

          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${status === 'success' ? 'bg-emerald-50 text-[#0f9f59]' : 'bg-red-50 text-red-500'}`}>
            {status === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <X className="w-7 h-7" />}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-1.5">{status === 'success' ? 'Request sent!' : 'Something went wrong'}</h2>
          <p className="text-sm text-slate-500 mb-6">{statusMessage}</p>

          <button type="button" onClick={resetAndClose} style={{ backgroundColor: status === 'success' ? '#0f9f59' : '#ef4444' }} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition cursor-pointer">
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold mb-2">Collaborate on {project?.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Your Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs p-3 border rounded-xl" />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Message</label>
            <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full text-xs p-3 border rounded-xl" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetAndClose} className="flex-1 py-2 text-xs border rounded-xl">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 text-xs bg-[#0f9f59] text-white rounded-xl disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}