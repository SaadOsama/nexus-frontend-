import React, { useState } from "react";
import { useSelector } from "react-redux";

// 🟢 Local components in pages/user/MyProjects/
import MyProjectsItemCard from "./MyProjectsItemCard";
import MyProjectsPublishModal from "./MyProjectsPublishModal";

// 🟢 Shared component in src/components/shared/
import ProjectDetailCard from "../../../src/components/shared/ProjectDetailCard";

import { Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetMyProjects } from "../../../src/api/client/projects";

export default function ProjectList() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🟢 FIX: page state drives real backend pagination (6 projects per page).
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch logged-in user's projects dynamically from API, paginated.
  const {
    data,
    isLoading,
    isError,
  } = useGetMyProjects({ page: currentPage, limit: 6 });

  const projects = data?.rows || [];
  const pagination = data?.pagination || {
    totalProjects: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Redux user state
  const currentUser = useSelector((state) => state.user?.user);

  if (selectedProject) {
    return (
      <ProjectDetailCard
        project={selectedProject}
        currentUserId={currentUser?.id}
        onBackToProjects={() => setSelectedProject(null)}
      />
    );
  }

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-[#0f9f59] tracking-wider uppercase">
            PROJECT NEXUS
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            My Projects
          </h1>
          <p className="text-sm text-gray-500 font-normal">
            Your workspace for building meaningful things.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#00a664', color: '#ffffff' }}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm active:scale-95"
        >
          <span className="text-lg leading-none font-normal">+</span>
          <span>Publish project</span>
        </button>
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">My projects</h2>
          {pagination.totalProjects > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {pagination.totalProjects} project{pagination.totalProjects === 1 ? '' : 's'} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your projects...
          </div>
        ) : isError ? (
          <div className="border border-dashed border-red-200 rounded-2xl p-12 text-center text-sm text-red-400 bg-red-50/50">
            Could not load your projects. Please try again.
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="cursor-pointer"
                >
                  <MyProjectsItemCard project={project} />
                </div>
              ))}
            </div>

            {/* 🟢 NEW: Pagination controls — only shown when there's more than one page */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    style={
                      page === currentPage
                        ? { backgroundColor: '#00a664', color: '#ffffff' }
                        : undefined
                    }
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      page === currentPage
                        ? ''
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-gray-200 rounded-2xl bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0f9f59] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Your project shelf is empty
              </h3>
              <p className="text-sm text-gray-500">
                Publish an idea and invite collaborators to help it grow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{ backgroundColor: '#00a664', color: '#ffffff' }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer mt-2"
            >
              Publish your first project
            </button>
          </div>
        )}
      </div>

      {/* Publish Project Modal */}
      <MyProjectsPublishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
