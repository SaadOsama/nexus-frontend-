import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';

export const ProjectCard = ({ project, onClick }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group cursor-pointer"
    >
      <div>
        {/* Top Header: Category Pill & Bookmark */}
        <div className="flex items-center justify-between mb-4">
          <span className="bg-emerald-50 text-[#0f9f59] text-xs font-medium px-3 py-1 rounded-full">
            {project?.category || project?.industry || 'General'}
          </span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-slate-700 text-slate-700' : ''}`} />
          </button>
        </div>

        {/* Project Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0f9f59] transition-colors mb-2">
          {project?.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
          {project?.description}
        </p>

        {/* Tag Chips */}
        {project?.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100/80 text-slate-600 text-[11px] px-2.5 py-1 rounded-lg font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-between pt-2 text-xs font-medium border-t border-slate-50">
        <span className="text-slate-400">
          {project?.stage || 'N/A'} · {project?.country || 'N/A'}
        </span>
        {project?.match && (
          <span className="text-[#0f9f59] font-semibold">
            {project.match}% match
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;