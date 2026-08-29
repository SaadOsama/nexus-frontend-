import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ProjectGrid from '../../../src/components/Cards/ProjectGrid';
import OverviewPublishModal from './OverviewPublishModal';
import ProjectDetailCard from '../../../src/components/shared/ProjectDetailCard';

const Overview = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleOpenModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (selectedProject) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 font-sans pb-10 relative">
        <ProjectDetailCard
          project={selectedProject}
          onBackToProjects={() => setSelectedProject(null)}
        />

        <OverviewPublishModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-14 space-y-8 font-sans pb-10 relative">

      <div className="flex items-start justify-between pt-4">
        <div>
          <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
            PROJECT NEXUS
          </span>
          <h1 className="text-4xl font-bold text-slate-900 mt-1">
            Overview
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Your workspace for building meaningful things.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          style={{ backgroundColor: '#0f9f59' }}
          className="hover:opacity-90 text-white text-sm font-semibold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all cursor-pointer relative z-20 pointer-events-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">

        <div
          style={{ backgroundColor: '#0f9f59', borderRadius: '20px' }}
          className="lg:col-span-2 w-full text-white p-8 flex flex-col justify-between items-start min-h-[220px] shadow-sm relative z-10"
        >
          <div className="space-y-4">
            <p className="text-sm text-emerald-100/90 font-medium">
              Good morning, Jordan
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug max-w-lg tracking-tight">
              Build what matters with the right people.
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="mt-8 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2.5 transition-all shadow-sm cursor-pointer border-none relative z-30 pointer-events-auto"
          >
            <span>Start a project</span>
            <Plus className="w-4 h-4 text-slate-900 stroke-[2.5]" />
          </button>
        </div>

      

      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Recommended for you
          </h3>
          <button
            type="button"
            style={{ color: '#0f9f59' }}
            className="text-sm font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            View all
          </button>
        </div>

        <ProjectGrid onSelectProject={(project) => setSelectedProject(project)} />
      </div>

      <OverviewPublishModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

    </div>
  );
};

export default Overview;