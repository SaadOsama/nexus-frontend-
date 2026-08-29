import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CollaborationRequestModal from '../../../pages/user/CollaborationRequests/CollaborationRequestModal';

const ProjectDetailCard = ({ project, onBackToProjects, isSaved, onToggleSave }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  if (!project) return null;

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
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 my-6">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 py-6 border-t border-slate-100 my-6">
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{project.stage || 'N/A'}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Stage</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{project.country || project.location || 'N/A'}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Location</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{project.match ? `${project.match}%` : 'N/A'}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Match</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-5 py-2.5 bg-[#0f9f59] hover:bg-[#0d8a4e] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Request collaboration
          </button>

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

          <button
            type="button"
            onClick={() => alert(`Opening chat with owner`)}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Message owner
          </button>
        </div>
      </div>

      {/* Collaboration Request Modal */}
      <CollaborationRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        project={project}
        onRequestSent={() => {}}
      />
    </div>
  );
};

export default ProjectDetailCard;