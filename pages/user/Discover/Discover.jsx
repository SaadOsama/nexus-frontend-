import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';

import ProjectGrid from '@/components/Cards/ProjectGrid';
import ProjectDetailCard from '@/components/shared/ProjectDetailCard';
import FilterDropdown from '@/components/Cards/FilterDropdown';
import OverviewPublishModal from '../Overview/OverviewPublishModal';

const Discover = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All projects');

  // Trigger state to refresh ProjectGrid when a new project is created in DB
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [savedProjectIds, setSavedProjectIds] = useState(() => {
    const saved = localStorage.getItem('nexus_saved_projects');
    return saved ? JSON.parse(saved) : [1];
  });

  useEffect(() => {
    localStorage.setItem('nexus_saved_projects', JSON.stringify(savedProjectIds));
  }, [savedProjectIds]);

  const handleToggleSave = (project) => {
    const id = typeof project === 'object' ? project.id : project;
    setSavedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
          <span>Publish project</span>
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
      />

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
