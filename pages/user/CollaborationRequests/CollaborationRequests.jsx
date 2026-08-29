import React, { useState } from 'react';
import { Inbox } from 'lucide-react';
import {
  useGetCollaborationRequests,
  useAcceptCollaboration,
  useDismissCollaboration,
} from '@/api/client/collaborations';
import CollaborationRequestCard from './CollaborationRequestCard.jsx';
import CollaborationRequestDetailModal from './CollaborationRequestDetailModal.jsx';

function normalizeRequests(raw = []) {
  return raw.map((r) => ({
    id: r.id,
    senderName: r.sender_name || r.senderName || r.from_name || r.from || 'Unknown',
    targetName: r.project_name || r.targetName || r.project?.title || 'Project',
    actionText: r.action_text || r.actionText || 'wants to collaborate on',
    email: r.sender_email || r.email || r.from_email || null,
    message: r.message || r.note || '',
    status: r.status,
    raw: r,
  }));
}

const CollaborationRequests = () => {
  const [selected, setSelected] = useState(null);

  const { data: rawData = [], isLoading } = useGetCollaborationRequests();
  const acceptMut = useAcceptCollaboration();
  const dismissMut = useDismissCollaboration();

  const requests = normalizeRequests(rawData);

  const handleAccept = (id) => acceptMut.mutate(id);
  const handleDismiss = (id) => dismissMut.mutate(id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-10">
      <div>
        <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
          PROJECT NEXUS
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Collaboration Requests</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review and manage incoming requests to collaborate.
        </p>
      </div>

      <h2 className="text-sm font-bold text-slate-900 pt-2">Inbox</h2>

      {isLoading ? (
        <div className="text-sm text-slate-400 py-6 text-center">Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No requests yet</p>
          <p className="text-xs text-slate-400">Incoming collaboration requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <CollaborationRequestCard
              key={req.id}
              request={req}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onOpenDetail={setSelected}
            />
          ))}
        </div>
      )}

      <CollaborationRequestDetailModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        request={selected}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
      />
    </div>
  );
};

export default CollaborationRequests;
