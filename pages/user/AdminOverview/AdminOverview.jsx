import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Check, X, RefreshCw, Eye } from 'lucide-react';
import api from '@/api/axios';

function AdminOverview({ onExit }) {
  const [requests, setRequests] = useState([]); // collaboration requests
  const [projectRequests, setProjectRequests] = useState([]); // ðŸŸ¢ NEW: pending projects
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true); // ðŸŸ¢ NEW
  const [actionLoading, setActionLoading] = useState(false);

  // ðŸŸ¢ NEW: which queue tab is active
  const [activeQueue, setActiveQueue] = useState('collaborations'); // 'collaborations' | 'projects'

  // Modal & Response State
  const [selectedReq, setSelectedReq] = useState(null);
  const [selectedReqType, setSelectedReqType] = useState('collaboration'); // ðŸŸ¢ NEW: 'collaboration' | 'project'
  const [adminNote, setAdminNote] = useState('');

  // Helper function to get token reliably
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch pending collaboration requests from Backend API
  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/collaborations/admin/requests`, {
        headers: getAuthHeader()
      });
      if (response.data.success) {
        setRequests(response.data.data || response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching admin requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // ðŸŸ¢ NEW: Fetch pending project publish requests
  const fetchPendingProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await api.get(`/projects/admin/pending`, {
        headers: getAuthHeader()
      });
      if (response.data.success) {
        setProjectRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingProjects(); // ðŸŸ¢ NEW
  }, []);

  // Accept or Reject Collaboration Request Handler with Optional Note
  const handleAction = async (id, status) => {
    setActionLoading(true);
    try {
      const response = await api.put(
        `/collaborations/admin/requests/${id}/status`,
        {
          status: status,
          action: status,
          adminNote
        },
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        setRequests((prev) => prev.filter((item) => item.id !== id));
        setSelectedReq(null);
        setAdminNote('');
      }
    } catch (error) {
      console.error(`Error performing ${status} action:`, error);
      alert('Failed to update request status.');
    } finally {
      setActionLoading(false);
    }
  };

  // ðŸŸ¢ NEW: Approve or Reject a pending PROJECT (with optional admin note/comment)
  const handleProjectAction = async (id, action) => {
    setActionLoading(true);
    try {
      const response = await api.post(
        `/projects/admin/action/${id}`,
        { action, adminNote },
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        setProjectRequests((prev) => prev.filter((item) => item.id !== id));
        setSelectedReq(null);
        setAdminNote('');
      }
    } catch (error) {
      console.error(`Error performing project ${action} action:`, error);
      alert('Failed to update project status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExit = () => {
    if (onExit) onExit();
    else window.location.href = '/';
  };

  // ðŸŸ¢ UPDATED: pending requests stat now counts both queues combined
  const stats = [
    { value: '1,248', label: 'Registered users' },
    { value: '86', label: 'Active projects' },
    { value: requests.length + projectRequests.length, label: 'Pending requests' },
    { value: '94%', label: 'Trust score' },
  ];

  const activeLoading = activeQueue === 'collaborations' ? loading : projectsLoading;
  const activeList = activeQueue === 'collaborations' ? requests : projectRequests;

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

          {/* Dynamic Moderation Queue (Collaboration Requests + Project Approvals) */}
          <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Pending Requests Queue</h3>
              <button
                onClick={() => {
                  fetchPendingRequests();
                  fetchPendingProjects();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || projectsLoading) ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* ðŸŸ¢ NEW: Tabs to switch between the two queues */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
              <button
                type="button"
                onClick={() => setActiveQueue('collaborations')}
                className={`flex-1 text-[11px] sm:text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeQueue === 'collaborations'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Collaborations
                {requests.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {requests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveQueue('projects')}
                className={`flex-1 text-[11px] sm:text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeQueue === 'projects'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Projects
                {projectRequests.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {projectRequests.length}
                  </span>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {activeLoading ? (
                <p className="text-xs text-slate-400 py-4 text-center">Loading requests...</p>
              ) : activeList.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {activeQueue === 'collaborations'
                    ? 'No pending collaboration requests.'
                    : 'No pending project submissions.'}
                </p>
              ) : activeQueue === 'collaborations' ? (
                requests.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedReq(item);
                      setSelectedReqType('collaboration');
                      setAdminNote('');
                    }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4 border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-all"
                  >
                    <div className="min-w-0 break-words text-xs sm:text-sm text-slate-700 space-y-0.5">
                      <p className="font-semibold text-slate-900">
                        {item.sender_name || item.senderName || `User #${item.sender_id}`}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Project: <span className="font-medium text-slate-800">{item.project_title || item.targetName || `#${item.project_id}`}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        <Eye className="w-3.5 h-3.5" /> View Request
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // ðŸŸ¢ NEW: Project publish requests list
                projectRequests.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedReq(item);
                      setSelectedReqType('project');
                      setAdminNote('');
                    }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4 border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-all"
                  >
                    <div className="min-w-0 break-words text-xs sm:text-sm text-slate-700 space-y-0.5">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-slate-500 text-[11px]">
                        By <span className="font-medium text-slate-800">{item.ownerName || `User #${item.user_id}`}</span>
                        {' Â· '}{item.category || item.industry || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent activity */}
          <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent platform activity</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4">
                <p className="min-w-0 break-words text-xs sm:text-sm text-slate-700">32 new projects this week</p>
                <span className="text-xs text-slate-400 font-medium">Activity</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4">
                <p className="min-w-0 break-words text-xs sm:text-sm text-slate-700">18 users completed profiles</p>
                <span className="text-xs text-slate-400 font-medium">Activity</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4">
                <p className="min-w-0 break-words text-xs sm:text-sm text-slate-700">7 projects reached team capacity</p>
                <span className="text-xs text-slate-400 font-medium">Activity</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* MODAL: Request Details & Action â€” ðŸŸ¢ UPDATED: handles both collaboration & project types */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedReqType === 'project' ? 'Project Submission Details' : 'Collaboration Request Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReqType === 'project' ? (
                    <>
                      Submitted by: <span className="font-semibold text-slate-700">{selectedReq.ownerName || `User #${selectedReq.user_id}`}</span>
                      {selectedReq.ownerEmail && ` (${selectedReq.ownerEmail})`}
                    </>
                  ) : (
                    <>
                      Applicant: <span className="font-semibold text-slate-700">{selectedReq.sender_name || selectedReq.senderName}</span>
                      {(selectedReq.sender_email || selectedReq.senderEmail) && ` (${selectedReq.sender_email || selectedReq.senderEmail})`}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3.5">
              {selectedReqType === 'project' ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Project Title</label>
                    <div className="mt-1 rounded-xl bg-slate-50 p-3 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-100">
                      {selectedReq.title}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                    <div className="mt-1 min-h-[70px] rounded-xl bg-slate-50 p-3 text-xs sm:text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                      {selectedReq.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                      <div className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        {selectedReq.category || selectedReq.industry || 'General'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stage</label>
                      <div className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        {selectedReq.stage || 'N/A'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Project</label>
                    <div className="mt-1 rounded-xl bg-slate-50 p-3 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-100">
                      {selectedReq.project_title || selectedReq.targetName || `Project ID: #${selectedReq.project_id}`}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">User Message / Proposal</label>
                    <div className="mt-1 min-h-[70px] rounded-xl bg-slate-50 p-3 text-xs sm:text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                      {selectedReq.message || "No specific message attached with this request."}
                    </div>
                  </div>
                </>
              )}

              {/* Response Note to User */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedReqType === 'project' ? 'Rejection reason / Note (Optional for approve, recommended for reject)' : 'Response / Note to User (Optional)'}
                </label>
                <textarea
                  rows="2"
                  placeholder="Provide feedback or instructions for the user..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  selectedReqType === 'project'
                    ? handleProjectAction(selectedReq.id, 'approve')
                    : handleAction(selectedReq.id, 'accepted')
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-4 w-4" /> {selectedReqType === 'project' ? 'Approve Project' : 'Accept Request'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  selectedReqType === 'project'
                    ? handleProjectAction(selectedReq.id, 'reject')
                    : handleAction(selectedReq.id, 'rejected')
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-4 w-4" /> {selectedReqType === 'project' ? 'Reject Project' : 'Reject Request'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminOverview;




