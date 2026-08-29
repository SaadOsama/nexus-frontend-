import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import ProjectDetailCard from '../../../src/components/shared/ProjectDetailCard';
import { useGetProjects } from "@/api/client/projects";

export default function SavedProjects() {
  const [selectedProject, setSelectedProject] = useState(null);

  // Uses the shared `api` instance (with the auth token attached) instead
  // of a raw axios call to http://localhost:5000 — this is what makes
  // this page actually respect requirement #4 (no data without login),
  // and it's also what carries the isOwner / hasRequested flags per
  // project for requirements #2 and #6.
  const { data: allProjects = [], isLoading, isError } = useGetProjects();

  const [savedProjectIds, setSavedProjectIds] = useState(() => {
    const saved = localStorage.getItem('nexus_saved_projects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_saved_projects', JSON.stringify(savedProjectIds));
  }, [savedProjectIds]);

  const handleToggleSave = (projectOrId) => {
    const id = typeof projectOrId === 'object' ? projectOrId.id : projectOrId;
    setSavedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const savedProjects = allProjects.filter((p) => savedProjectIds.includes(p.id));

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
    <div className="min-h-screen bg-white font-sans">
      <div className="p-8 md:p-10 space-y-8 max-w-7xl">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-[#00a664] tracking-wider uppercase">PROJECT NEXUS</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Saved Projects</h1>
          <p className="text-sm text-slate-400 font-normal">Your workspace for building meaningful things.</p>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-slate-900">Saved projects</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 h-56 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="border border-dashed border-red-200 rounded-2xl p-12 text-center text-sm text-red-400 bg-red-50/50 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin opacity-0" />
              Could not load projects from server.
            </div>
          ) : savedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProjects.map((project) => {
                const isSaved = savedProjectIds.includes(project.id);
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-50 text-[#00a664] text-xs font-semibold px-3 py-1 rounded-full">
                        {project.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleSave(project.id); }}
                        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                        title={isSaved ? "Remove from saved" : "Save project"}
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#00a664] text-[#00a664]' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#00a664] transition-colors">{project.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{project.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(project.tags || []).map((tag, i) => (
                        <span key={i} className="bg-slate-50 text-slate-500 text-[11px] font-medium px-2.5 py-1 rounded-md">{tag}</span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                      <span>{project.stage} · {project.country || project.location}</span>
                      <span className="font-bold text-[#00a664]">{project.match}% match</span>
                    </div>

                    {/* isOwner / hasRequested come from the backend join in
                        getBrowseProjects — this is the pattern to reuse
                        wherever a "Request Collaboration" button appears
                        (requirements #2 and #6). */}
                    {!project.isOwner && (
                      <button
                        type="button"
                        disabled={project.hasRequested}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs font-semibold py-2 rounded-xl bg-[#0f9f59] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {project.hasRequested ? 'Request sent' : 'Request Collaboration'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-400 bg-slate-50/50">
              No saved projects yet. Bookmark projects to view them here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
