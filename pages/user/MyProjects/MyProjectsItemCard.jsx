import React from 'react';
import { Clock, XCircle, CheckCircle2 } from 'lucide-react';

const statusConfig = {
  pending: {
    label: 'Pending review',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'bg-red-50 text-red-600 border border-red-100',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-[#0f9f59] border border-emerald-100',
  },
};

export const MyProjectsItemCard = ({ project, onClick }) => {
  const status = project?.status; // 'pending' | 'approved' | 'rejected'
  const statusInfo = statusConfig[status];
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group cursor-pointer ${
        isRejected ? 'border-red-100 opacity-80' : isPending ? 'border-amber-100' : 'border-slate-100'
      }`}
    >
      <div>
        {/* Top Header: Category Pill & Status Badge */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <span className="bg-emerald-50 text-[#0f9f59] text-xs font-medium px-3 py-1 rounded-full">
            {project?.category || project?.industry || 'General'}
          </span>

          {statusInfo && (
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusInfo.badgeClass}`}>
              <statusInfo.icon className="w-3 h-3" />
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* Project Title */}
        <h3 className={`text-lg font-bold transition-colors mb-2 ${
          isRejected ? 'text-slate-500' : 'text-slate-900 group-hover:text-[#0f9f59]'
        }`}>
          {project?.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
          {project?.description}
        </p>

        {/* Admin note — only shown when rejected */}
        {isRejected && project?.admin_response && (
          <div className="bg-red-50/60 border border-red-100 rounded-xl px-3 py-2 mb-3">
            <p className="text-[11px] font-semibold text-red-600 mb-0.5">Admin note</p>
            <p className="text-[11px] text-red-500 leading-relaxed">{project.admin_response}</p>
          </div>
        )}

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
      </div>
    </div>
  );
};

export default MyProjectsItemCard;