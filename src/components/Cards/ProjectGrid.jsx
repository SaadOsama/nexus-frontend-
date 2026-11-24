import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import FeaturedBadge from '../shared/FeaturedBadge';
import axios from 'axios';

const ProjectGrid = ({
  onSelectProject,
  onOpen,
  savedProjectIds = [],
  onToggleSave,
  filters = {},
  currentPage = 1,
  onPaginationData,
  onClearAll,
}) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = useSelector((state) => state.user?.user);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    const f = JSON.parse(filterKey);

    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get('https://nexus-backend-fbcotg.fly.dev/api/projects', {
          params: {
            page: currentPage,
            limit: 6,
            current_user_id: currentUser?.id || undefined,
            q: f.q || undefined,
            industry: f.industry?.length ? f.industry.join(',') : undefined,
            stage: f.stage?.length ? f.stage.join(',') : undefined,
            country: f.country || undefined,
            funding: f.funding || undefined,
            sort: f.sort || undefined,
          },
        });

        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];

        if (isMounted && res.data?.pagination && onPaginationData) {
          onPaginationData(res.data.pagination);
        }

        const normalized = rows.map((p) => ({
          ...p,
          is_featured: Number(p.is_featured || 0),
          country: p.country ?? p.location ?? '',
          isOwner: Boolean(p.isOwner),
          hasRequested: Boolean(p.hasRequested),
          tags: Array.isArray(p.tags)
            ? p.tags
            : (() => {
                try {
                  return JSON.parse(p.tags || '[]');
                } catch {
                  return [];
                }
              })(),
        }));

        if (isMounted) setProjects(normalized);
      } catch (err) {
        console.error('Error fetching projects:', err);
        if (isMounted) setError('Could not load projects from server.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, currentUser?.id, filterKey]);

  const handleSelect = (e, project) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    if (onSelectProject || onOpen) {
      e.preventDefault();
      if (onSelectProject) onSelectProject(project);
      if (onOpen) onOpen(project);
    }
  };

  const handleBookmarkClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) onToggleSave(project);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/60 bg-white p-6 h-64 animate-pulse min-w-0"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-dashed border-red-200 rounded-2xl p-12 text-center text-sm text-red-400 bg-red-50/50 w-full flex flex-col items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin opacity-0" />
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50/50 w-full space-y-3">
        <p className="text-sm text-slate-500">
          No projects match your search or filters. Try removing a filter or searching for
          something else.
        </p>
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-white px-4 py-2 rounded-xl cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#0f9f59' }}
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {projects.map((project) => {
        const isSaved = savedProjectIds.includes(project.id);
        const isFeatured = Number(project.is_featured) === 1;

        return (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            onClick={(e) => handleSelect(e, project)}
            className={`text-left rounded-2xl border bg-white p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group min-w-0 w-full ${
              isFeatured ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-4 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{ backgroundColor: '#e6f4ea', color: '#0f9f59' }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {project.category || project.industry || 'General'}
                </span>
                <FeaturedBadge show={isFeatured} />
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={(e) => handleBookmarkClick(e, project)}
                onKeyDown={(e) => e.key === 'Enter' && handleBookmarkClick(e, project)}
                className="p-1.5 -mr-1 rounded-full hover:bg-slate-100 transition cursor-pointer shrink-0"
                title={isSaved ? 'Remove from saved' : 'Save project'}
              >
                <Bookmark
                  className={`w-4 h-4 transition-all ${
                    isSaved
                      ? 'text-[#0f9f59] fill-[#0f9f59]'
                      : 'text-slate-300 group-hover:text-slate-400'
                  }`}
                />
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-2 break-words">{project.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed flex-1 break-words line-clamp-3">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
              {(project.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-2">
              <span className="text-sm text-slate-400 truncate">
                {project.stage}{' '}
                {project.country || project.location
                  ? `· ${project.country || project.location}`
                  : ''}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default ProjectGrid;