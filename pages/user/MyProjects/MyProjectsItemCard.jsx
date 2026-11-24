import React from 'react';
import { Clock, XCircle, CheckCircle2, FileEdit, AlertCircle, Pencil, Trash2, Send } from 'lucide-react';

const normalizeStatus = (raw) => String(raw || '').toLowerCase().replace(/[\s_]+/g, '-');

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  'pending-review': {
    label: 'Pending review',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  pending: {
    label: 'Pending review',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  'changes-requested': {
    label: 'Changes requested',
    icon: AlertCircle,
    badgeClass: 'bg-orange-50 text-orange-700 border border-orange-100',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'bg-red-50 text-red-600 border border-red-100',
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-[#0f9f59] border border-emerald-100',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-[#0f9f59] border border-emerald-100',
  },
};

export const MyProjectsItemCard = ({
  project,
  onClick,
  onEdit,
  onDelete,
  onSubmitDraft,
}) => {
  const status = normalizeStatus(project?.status);
  const statusInfo = statusConfig[status];
  const isDraft = status === 'draft';
  const isRejected = status === 'rejected';
  const isChangesRequested = status === 'changes-requested';
  const isPending = status === 'pending-review' || status === 'pending';
  const canEdit = isDraft || isChangesRequested || isRejected;
  const adminNote = project?.admin_note || project?.admin_response || project?.feedback || '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group cursor-pointer ${
        isRejected ? 'border-red-100 opacity-80' : isChangesRequested ? 'border-orange-100' : isPending ? 'border-amber-100' : 'border-slate-100'
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

        {/* Admin note — shown for changes requested and rejected */}
        {(isChangesRequested || isRejected) && adminNote && (
          <div
            className={`rounded-xl px-3 py-2 mb-3 border ${
              isChangesRequested ? 'bg-orange-50/70 border-orange-100' : 'bg-red-50/60 border-red-100'
            }`}
          >
            <p
              className={`text-[11px] font-semibold mb-0.5 ${
                isChangesRequested ? 'text-orange-700' : 'text-red-600'
              }`}
            >
              Admin note
            </p>
            <p
              className={`text-[11px] leading-relaxed ${
                isChangesRequested ? 'text-orange-600' : 'text-red-500'
              }`}
            >
              {adminNote}
            </p>
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

      {/* Bottom Footer + Status Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs font-medium border-t border-slate-50">
        <span className="text-slate-400">
          {project?.stage || 'N/A'} · {project?.country || 'N/A'}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isDraft && onSubmitDraft && (
            <button
              type="button"
              onClick={() => onSubmitDraft(project)}
              className="px-2.5 py-1 rounded-lg bg-[#0f9f59] text-white text-[11px] font-semibold hover:opacity-90 flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          )}

          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              <span>{isChangesRequested || isRejected ? 'Edit & resubmit' : 'Edit'}</span>
            </button>
          )}

          {isDraft && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project)}
              className="px-2 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Delete draft"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProjectsItemCard;