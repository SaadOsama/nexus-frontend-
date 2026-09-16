import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import ProjectGrid from '@/components/Cards/ProjectGrid';
import ProjectDetailCard from '@/components/shared/ProjectDetailCard';
import FilterDropdown from '@/components/Cards/FilterDropdown';
import OverviewPublishModal from '../Overview/OverviewPublishModal';
import { useToggleSaveProject, useGetSavedProjects } from '@/api/client/projects';

const Discover = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All projects');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Trigger state to refresh ProjectGrid when a new project is created in DB
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 🟢 FIX: no hardcoded default, real IDs come from backend below
  const [savedProjectIds, setSavedProjectIds] = useState(() => {
    const saved = localStorage.getItem('nexus_saved_projects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_saved_projects', JSON.stringify(savedProjectIds));
  }, [savedProjectIds]);

  // 🟢 FIX: sync savedProjectIds with the real database state on load,
  // so bookmark icons and save/unsave calls never go out of sync with the DB.
  const { data: savedData } = useGetSavedProjects({ page: 1, limit: 100 });

  useEffect(() => {
    if (savedData?.rows) {
      setSavedProjectIds(savedData.rows.map((p) => p.id));
    }
  }, [savedData]);

  // Reset page to 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // 🟢 FIX: real backend save/unsave call added, localStorage kept for instant UI sync
  const toggleSave = useToggleSaveProject();

  const handleToggleSave = (project) => {
    const id = typeof project === 'object' ? project.id : project;
    const isCurrentlySaved = savedProjectIds.includes(id);

    // Optimistic local UI update (bookmark icon turant badalta hai)
    setSavedProjectIds((prev) =>
      isCurrentlySaved ? prev.filter((item) => item !== id) : [...prev, id]
    );

    // Real backend call — saved_projects table mein insert/delete
    toggleSave.mutate({ project_id: id, isSaved: isCurrentlySaved });
  };

  const handlePaginationReceive = (paginationData) => {
    if (paginationData && typeof paginationData.totalPages === 'number') {
      setTotalPages(paginationData.totalPages);
    }
  };

  const categories = [
    'All projects',
    'Climate & Energy',
    'Health & Wellness',
    'Education',
    'Fintech',
  ];

  if (selectedProject) {
    return (
      <ProjectDetailCard
        project={selectedProject}
        onBackToProjects={() => setSelectedProject(null)}
        isSaved={savedProjectIds.includes(selectedProject.id)}
        onToggleSave={() => handleToggleSave(selectedProject.id)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-10">

      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
            PROJECT NEXUS
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Discover
          </h1>
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
          <span>Publish projects</span>
        </button>
      </div>

      <h2 className="text-sm font-bold text-slate-900 pt-2">
        Discover projects
      </h2>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, skills, or keywords"
            className="w-full pl-10 pr-4 py-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <FilterDropdown
            label="All projects"
            options={categories}
            selectedValue={selectedCategory === 'All projects' ? '' : selectedCategory}
            onSelect={(category) => setSelectedCategory(category || 'All projects')}
          />
        </div>
      </div>

      {/* Project Grid */}
      <ProjectGrid
        key={refreshTrigger}
        onSelectProject={(project) => setSelectedProject(project)}
        savedProjectIds={savedProjectIds}
        onToggleSave={handleToggleSave}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        currentPage={currentPage}
        onPaginationData={handlePaginationReceive}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      {/* Publish Project Modal */}
      <OverviewPublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onProjectPublished={() => setRefreshTrigger((prev) => prev + 1)}
      />

    </div>
  );
};

export default Discover;