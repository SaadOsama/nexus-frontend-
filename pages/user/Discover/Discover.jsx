import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

import ProjectGrid from '@/components/Cards/ProjectGrid';
import ProjectDetailCard from '@/components/shared/ProjectDetailCard';
import DiscoverFilters from '@/components/Cards/DiscoverFilters';
import OverviewPublishModal from '../Overview/OverviewPublishModal';
import FeaturedBadge from '../../../src/components/shared/FeaturedBadge';

import { useToggleSaveProject, useGetSavedProjects } from '@/api/client/projects';

const toList = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

const Discover = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ---------- Filter state URL mein ----------
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const industry = toList(searchParams.get('industry'));
  const stage = toList(searchParams.get('stage'));
  const country = searchParams.get('country') || '';
  const funding = searchParams.get('funding') || '';
  const sort = searchParams.get('sort') || 'featured';
  const currentPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const updateParams = (changes, { resetPage = true } = {}) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          const val = Array.isArray(value) ? value.join(',') : String(value ?? '');
          const isDefault =
            !val ||
            (key === 'sort' && val === 'featured') ||
            (key === 'page' && val === '1');
          if (isDefault) next.delete(key);
          else next.set(key, val);
        });
        if (resetPage) next.delete('page'); // filter badalne par page 1
        return next;
      },
      { replace: true }
    );
  };

  // ---------- Search: 300 ms debounce + URL sync ----------
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (searchInput.trim() === q) return undefined;
    const t = setTimeout(() => updateParams({ q: searchInput.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput('');
    updateParams({ q: '' });
  };

  const hasActiveFilters = Boolean(
    q || industry.length || stage.length || country || funding || sort !== 'featured'
  );

  const handleClearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  // ---------- Saved projects ----------
  const [savedProjectIds, setSavedProjectIds] = useState(() => {
    const saved = localStorage.getItem('nexus_saved_projects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_saved_projects', JSON.stringify(savedProjectIds));
  }, [savedProjectIds]);

  const { data: savedData } = useGetSavedProjects({ page: 1, limit: 100 });

  useEffect(() => {
    if (savedData?.rows) {
      setSavedProjectIds(savedData.rows.map((p) => p.id));
    }
  }, [savedData]);

  const toggleSave = useToggleSaveProject();

  const handleToggleSave = (project) => {
    const id = typeof project === 'object' ? project.id : project;
    const isCurrentlySaved = savedProjectIds.includes(id);

    setSavedProjectIds((prev) =>
      isCurrentlySaved ? prev.filter((item) => item !== id) : [...prev, id]
    );

    toggleSave.mutate({ project_id: id, isSaved: isCurrentlySaved });
  };

  const handlePaginationReceive = (p) => {
    if (!p) return;
    if (typeof p.totalPages === 'number') setTotalPages(p.totalPages);
    if (typeof p.totalProjects === 'number') setTotalProjects(p.totalProjects);
  };

  if (selectedProject) {
    return (
      <div className="space-y-3">
        {Number(selectedProject.is_featured) === 1 && (
          <div className="flex items-center gap-2">
            <FeaturedBadge show={true} />
          </div>
        )}
        <ProjectDetailCard
          project={selectedProject}
          onBackToProjects={() => setSelectedProject(null)}
          isSaved={savedProjectIds.includes(selectedProject.id)}
          onToggleSave={() => handleToggleSave(selectedProject.id)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
            PROJECT NEXUS
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Discover</h1>
          <p className="text-xs text-slate-400 mt-1">
            Your workspace for building meaningful things.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPublishModalOpen(true)}
          style={{ backgroundColor: '#0f9f59' }}
          className="hover:opacity-90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish project</span>
        </button>
      </div>

      <h2 className="text-sm font-bold text-slate-900 pt-2">Discover projects</h2>

      <DiscoverFilters
        searchInput={searchInput}
        onSearchInput={setSearchInput}
        onClearSearch={handleClearSearch}
        industry={industry}
        stage={stage}
        country={country}
        funding={funding}
        sort={sort}
        onChange={updateParams}
        totalProjects={totalProjects}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearAll}
      />

      <ProjectGrid
        key={refreshTrigger}
        onSelectProject={(project) => setSelectedProject(project)}
        savedProjectIds={savedProjectIds}
        onToggleSave={handleToggleSave}
        filters={{ q, industry, stage, country, funding, sort }}
        currentPage={currentPage}
        onPaginationData={handlePaginationReceive}
        onClearAll={handleClearAll}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => updateParams({ page: currentPage - 1 }, { resetPage: false })}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => updateParams({ page: pageNum }, { resetPage: false })}
              className={`w-9 h-9 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#0f9f59] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => updateParams({ page: currentPage + 1 }, { resetPage: false })}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      <OverviewPublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onProjectPublished={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default Discover;