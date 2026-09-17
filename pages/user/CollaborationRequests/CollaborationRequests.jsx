import React, { useState } from 'react';
import {
  Inbox, ShieldCheck, CheckCircle2, XCircle, Clock, MessageSquare, X, Loader2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  useGetAdminPendingRequests,
  useGetMySentRequests,
  useAdminCollaborationAction,
} from '@/api/client/collaborations';
import {
  useGetPendingProjects,
  useProjectAdminAction,
} from '@/api/client/ProjectApprovals';
import CollaborationRequestCard from './CollaborationRequestCard.jsx';
import CollaborationRequestDetailModal from './CollaborationRequestDetailModal.jsx';

function normalizeRequests(raw = []) {
  return raw.map((r) => ({
    id: r.id,
    senderName: r.sender_name || r.senderName || r.from_name || r.from || 'Unknown',
    targetName: r.targetName || r.project_name || r.project_title || r.project?.title || 'Project',
    actionText: r.action_text || r.actionText || 'wants to collaborate on',
    email: r.sender_email || r.senderEmail || r.email || r.from_email || null,
    message: r.message || r.user_message || r.note || '',
    status: r.status,
    adminResponse: r.admin_response || r.adminNote || '',
    raw: r,
  }));
}

const renderStatusBadge = (status) => {
  if (status === 'approved' || status === 'accepted') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
        <XCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
      <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
    </span>
  );
};

// 🟢 NEW: small note modal reused for rejecting a project with a reason
const RejectNoteModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', zIndex: 999999 }} className="flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-bold text-slate-900 mb-2">Reject project</h3>
        <p className="text-xs text-slate-400 mb-4">Reject karne ki wajah likhein (user ko ye note dikhega).</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="e.g. Description bahut short hai, aur detail add karein."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">Cancel</button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Reject project
          </button>
        </div>
      </div>
    </div>
  );
};

// 🟢 NEW: one card per pending project in the admin queue
const ProjectApprovalCard = ({ project, onApprove, onReject, loading }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-slate-200">
    <div className="flex justify-between items-start gap-3">
      <div>
        <span className="bg-emerald-50 text-[#0f9f59] text-[11px] font-medium px-2.5 py-1 rounded-full">
          {project.category || project.industry || 'General'}
        </span>
        <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2">{project.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          By {project.ownerName || 'Unknown'} ({project.ownerEmail || 'no email'})
        </p>
      </div>
      {renderStatusBadge('pending')}
    </div>

    <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>

    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
      <button
        type="button"
        onClick={() => onApprove(project.id)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0f9f59] hover:bg-[#0d8a4e] px-4 py-2 rounded-xl disabled:opacity-50 cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
      </button>
      <button
        type="button"
        onClick={() => onReject(project.id)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl disabled:opacity-50 cursor-pointer"
      >
        <XCircle className="w-3.5 h-3.5" /> Reject
      </button>
    </div>
  </div>
);

const CollaborationRequests = () => {
  const [selected, setSelected] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // 🟢 NEW: which queue the admin is looking at
  const [activeTab, setActiveTab] = useState('collaborations'); // 'collaborations' | 'projects'

  const currentUser = useSelector((state) => state.user?.user);
  const isAdmin = currentUser?.role === 'admin';

  // Collaboration requests data
  const adminRequestsQuery = useGetAdminPendingRequests({ enabled: isAdmin && activeTab === 'collaborations' });
  const mySentRequestsQuery = useGetMySentRequests({ enabled: !isAdmin });
  const adminActionMut = useAdminCollaborationAction();

  // 🟢 NEW: project approvals data
  const pendingProjectsQuery = useGetPendingProjects({ enabled: isAdmin && activeTab === 'projects' });
  const projectActionMut = useProjectAdminAction();

  const rawData = isAdmin ? adminRequestsQuery.data : mySentRequestsQuery.data;
  const isLoading = isAdmin
    ? (activeTab === 'collaborations' ? adminRequestsQuery.isLoading : pendingProjectsQuery.isLoading)
    : mySentRequestsQuery.isLoading;

  const requests = normalizeRequests(rawData || []);
  const pendingProjects = pendingProjectsQuery.data || [];

  const handleAccept = (id) => {
    if (isAdmin) adminActionMut.mutate({ id, action: 'accept' });
  };

  const handleDismiss = (id) => {
    if (isAdmin) adminActionMut.mutate({ id, action: 'reject' });
  };

  // 🟢 NEW: project approve/reject handlers
  const handleApproveProject = (id) => {
    projectActionMut.mutate({ id, action: 'approve' });
  };

  const handleRejectProjectConfirm = (note) => {
    projectActionMut.mutate(
      { id: rejectTarget, action: 'reject', adminNote: note },
      { onSuccess: () => setRejectTarget(null) }
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider flex items-center gap-1">
          {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
          PROJECT NEXUS {isAdmin ? '(ADMIN MODE)' : ''}
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          {isAdmin ? 'Pending Approvals' : 'My Collaboration Requests'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isAdmin
            ? 'Review and approve/reject collaboration requests and new project submissions.'
            : 'Track the status of collaboration requests you have sent.'}
        </p>
      </div>

      {/* 🟢 NEW: Tabs — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('collaborations')}
            className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'collaborations'
                ? 'border-[#0f9f59] text-[#0f9f59]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Collaboration Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-[#0f9f59] text-[#0f9f59]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Project Approvals
            {pendingProjects.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingProjects.length}
              </span>
            )}
          </button>
        </div>
      )}

      <h2 className="text-sm font-bold text-slate-900 pt-1">
        {isAdmin
          ? (activeTab === 'collaborations' ? 'Admin Approval Queue' : 'New Project Submissions')
          : 'Status of Applications Sent'}
      </h2>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="text-sm text-slate-400 py-6 text-center">Loading…</div>
      ) : isAdmin && activeTab === 'projects' ? (
        // 🟢 NEW: Project Approvals tab content
        pendingProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No pending projects</p>
            <p className="text-xs text-slate-400">Saare submitted projects review ho chuke hain.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProjects.map((project) => (
              <ProjectApprovalCard
                key={project.id}
                project={project}
                onApprove={handleApproveProject}
                onReject={(id) => setRejectTarget(id)}
                loading={projectActionMut.isPending}
              />
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {isAdmin ? 'No pending approvals' : 'You haven’t sent any requests'}
          </p>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'All collaboration requests have been reviewed.'
              : 'Explore projects and click Collaborate to send requests.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {!isAdmin ? (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-slate-200"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{req.targetName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Request ID: #{req.id}
                    </p>
                  </div>
                  {renderStatusBadge(req.status)}
                </div>

                {req.message && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-800">Your Note: </span>
                    {req.message}
                  </div>
                )}

                {req.adminResponse && (
                  <div className="text-xs text-slate-800 bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900">Admin Note: </span>
                      {req.adminResponse}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            requests.map((req) => (
              <CollaborationRequestCard
                key={req.id}
                request={req}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onOpenDetail={setSelected}
              />
            ))
          )}
        </div>
      )}

      {isAdmin && (
        <CollaborationRequestDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          request={selected}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      )}

      {/* 🟢 NEW: reject-with-reason modal for projects */}
      <RejectNoteModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectProjectConfirm}
        loading={projectActionMut.isPending}
      />
    </div>
  );
};

export default CollaborationRequests;
