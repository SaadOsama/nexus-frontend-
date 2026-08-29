import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between min-h-[220px] cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="bg-[#e6f4ea] text-[#0f9f59] text-[11px] font-semibold px-3 py-1 rounded-full">
            {project.category || project.industry}
          </span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-slate-800 text-slate-800' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {project.title}
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {project.description}
          </p>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="bg-slate-50 text-slate-500 text-[10px] font-medium px-2.5 py-1.5 rounded-md border border-slate-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-5 mt-2 text-xs font-medium border-t border-slate-100/70">
        <span className="text-slate-400">
          {project.stage} · {project.country || project.location}
        </span>
        {project.match && (
          <span className="text-[#0f9f59] font-bold">
            {project.match}% match
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;