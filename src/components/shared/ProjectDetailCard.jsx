import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollaborationRequestModal from '../../../pages/user/CollaborationRequests/collaborationRequestModal';

const ProjectDetailCard = ({ project, currentUserId, onBackToProjects, isSaved, onToggleSave, onRequestSuccess }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!project) return null;

  // Backend Flags derived from project object
  const isMyProject = Boolean(project.isOwner) || Number(project.user_id) === Number(currentUserId);
  const alreadyRequested = Boolean(project.hasRequested);

  // 🟢 FIX: collaborationStatus ab backend se aata hai (pending_admin | approved | rejected | null)
  // "Message owner" button sirf tab dikhega jab admin ne request approve ki ho.
  const collaborationStatus = project.collaborationStatus || (alreadyRequested ? 'pending_admin' : null);
  const isApproved = collaborationStatus === 'approved';
  const isRejected = collaborationStatus === 'rejected';
  const isPending = collaborationStatus === 'pending_admin';

  // Parse tags if they are stringified JSON
  const parsedTags = typeof project.tags === 'string'
    ? JSON.parse(project.tags || '[]')
    : (project.tags || []);

  // Handler to navigate directly to Messages page with owner + project details
  const handleMessageOwnerClick = () => {
    const ownerId = project.owner_id || project.user_id;
    const ownerName = project.owner_name || project.ownerName || project.user?.name || 'Project Owner';

    navigate('/messages', {
      state: {
        selectedUserId: ownerId,
        selectedUserName: ownerName,
        // 🟢 FIX: these two were missing, which made Messages.jsx build a
        // conversation with projectId = undefined. Every fetch for that
        // conversation's history then hit GET /api/messages/undefined/:id
        // and 404'd. A chat here is ALWAYS about this specific project,
        // so its id/title must travel along with the owner's id.
        selectedProjectId: project.id,
        selectedProjectTitle: project.title,
      },
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBackToProjects}
        className="flex items-center gap-2 text-xs font-semibold text-[#0f9f59] hover:text-[#0d8a4e] transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to projects</span>
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        {/* Category Badge */}
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#e8f5e9] text-[#0f9f59] text-xs font-bold tracking-wide mb-4">
          {project.category || project.industry || 'Project'}
        </span>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {project.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
          {project.description}
        </p>

        {/* Tags */}
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 my-6">
            {parsedTags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 py-6 border-t border-slate-100 my-6">
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{project.stage || 'N/A'}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Stage</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{project.country || project.location || 'N/A'}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Location</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Dynamic Collaboration Request Button */}
          {isMyProject ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed"
            >
              Your Own Project
            </button>
          ) : isApproved ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-emerald-50 text-[#0f9f59] border border-emerald-200 text-xs font-semibold rounded-xl cursor-not-allowed flex items-center gap-1"
            >
              ✓ Request Accepted
            </button>
          ) : isRejected ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-red-50 text-red-500 border border-red-200 text-xs font-semibold rounded-xl cursor-not-allowed flex items-center gap-1"
            >
              ✕ Request Rejected
            </button>
          ) : isPending ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold rounded-xl cursor-not-allowed flex items-center gap-1"
            >
              ⏳ Request Sent
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-5 py-2.5 bg-[#0f9f59] hover:bg-[#0d8a4e] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Request collaboration
            </button>
          )}

          {/* Save Project Button */}
          <button
            type="button"
            onClick={onToggleSave}
            className={`px-5 py-2.5 border text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-50 border-emerald-200 text-[#0f9f59]'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {isSaved ? 'Saved' : 'Save project'}
          </button>

          {/* Message Owner Button — 🟢 Updated with Router Navigation */}
          {!isMyProject && isApproved && (
            <button
              type="button"
              onClick={handleMessageOwnerClick}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Message owner
            </button>
          )}
        </div>
      </div>

      {/* Collaboration Request Modal */}
      <CollaborationRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        project={{ ...project, isOwner: isMyProject, hasRequested: alreadyRequested }}
        onRequestSent={() => {
          if (onRequestSuccess) onRequestSuccess();
        }}
      />
    </div>
  );
};

export default ProjectDetailCard;
