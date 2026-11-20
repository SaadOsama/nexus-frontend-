import React from 'react';

export const ProfileProjectCard = ({ project }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3 hover:border-gray-300 transition-all">
      <h3 className="text-base font-bold text-gray-900">{project.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{project.description}</p>

      {/* Badges */}
      <div className="flex items-center gap-2 pt-1">
        {(project.category || project.industry) && (
          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium rounded-md font-mono">
            {project.category || project.industry}
          </span>
        )}
        {/* Stage comes from one field only: project.stage (same as every other card) */}
        {project.stage && (
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 text-[11px] font-semibold rounded-md font-mono">
            {project.stage}
          </span>
        )}
      </div>
    </div>
  );
};

// Default export taake "Profile.jsx" ise bina kisi error ke import kar sake
export default ProfileProjectCard;