import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Sparkles,
  ArrowRight,
  Search,
  Users,
  Rocket,
  Bookmark,
} from 'lucide-react';
import FeaturedBadge from '../../src/components/shared/FeaturedBadge';

// ==========================================
// FALLBACK MOCK DATA (agar DB/API unreachable ho)
// ==========================================
const fallbackProjects = [
  {
    id: 'mock-1',
    title: 'OpenGrid Energy',
    category: 'Climate & Energy',
    description:
      'Making renewable energy accessible to every community through an open, intelligent grid.',
    tags: ['Energy', 'Climate', 'Open source'],
    stage: 'Prototype',
    location: 'United Kingdom',
    is_featured: 0,
  },
  {
    id: 'mock-2',
    title: 'MediRoute',
    category: 'Health & Wellness',
    description:
      'A smarter way for remote communities to access preventative healthcare and local support.',
    tags: ['Healthcare', 'Mobile', 'Impact'],
    stage: 'MVP',
    location: 'Kenya',
    is_featured: 0,
  },
  {
    id: 'mock-3',
    title: 'Classroom OS',
    category: 'Education',
    description:
      'The collaborative workspace helping teachers make learning more personal for every student.',
    tags: ['EdTech', 'SaaS', 'Teachers'],
    stage: 'Early Revenue',
    location: 'Canada',
    is_featured: 0,
  },
];

const steps = [
  {
    icon: Search,
    title: 'Explore',
    description: 'Browse projects across climate, health, education and more — no account needed.',
  },
  {
    icon: Users,
    title: 'Connect',
    description: 'Find collaborators who match your skills and reach out to build together.',
  },
  {
    icon: Rocket,
    title: 'Publish',
    description: 'Share your own idea and let the right people find you.',
  },
];

// ==========================================
// PROJECT CARD
// ==========================================
const ProjectCard = ({ project, onProtectedClick }) => {
  const isFeatured = Number(project.is_featured) === 1;
  const categoryLabel = project.category || project.industry || project.tag || 'General';
  const chips = Array.isArray(project.tags)
    ? project.tags
    : Array.isArray(project.chips)
    ? project.chips
    : (() => {
        try {
          return JSON.parse(project.tags || '[]');
        } catch {
          return [];
        }
      })();
  const place = project.country || project.location || '';

  return (
    <div
      className={`bg-white border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${
        isFeatured ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[#0f9f59] bg-emerald-50 px-3 py-1 rounded-full">
            {categoryLabel}
          </span>
          <FeaturedBadge show={isFeatured} />
        </div>
        <button
          type="button"
          onClick={onProtectedClick}
          className="text-slate-300 hover:text-slate-500 cursor-pointer shrink-0"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3 flex-1">
        {project.description}
      </p>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-slate-400">
          {project.stage} {place ? `· ${place}` : ''}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// HOMEPAGE
// ==========================================
export default function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const { isAuthenticated, user } = useSelector((state) => state.user || {});

  useEffect(() => {
    let isMounted = true;

    const loadShowcaseProjects = async () => {
      try {
        // Backend already sorts by is_featured DESC, featured_at DESC, created_at DESC
        const res = await axios.get('https://nexus-backend-fbcotg.fly.dev/api/projects', {
          params: { page: 1, limit: 6 },
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        if (isMounted) {
          setProjects(rows.length > 0 ? rows : fallbackProjects);
        }
      } catch (err) {
        console.error('Failed to load homepage projects:', err);
        if (isMounted) setProjects(fallbackProjects);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };

    loadShowcaseProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const requireAuth = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/overview');
      }
    } else {
      navigate('/login');
    }
  };

  const hasAnyFeatured = projects.some((p) => Number(p.is_featured) === 1);

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      {/* ================= NAVBAR ================= */}
      <header className="w-full border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f9f59] flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-slate-900 text-sm">Project Nexus</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Innovation ecosystem</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <button type="button" onClick={() => navigate('/discover')} className="hover:text-slate-900 cursor-pointer">
            Discover
          </button>
          <a href="#how-it-works" className="hover:text-slate-900">
            How it works
          </a>
          <button type="button" onClick={requireAuth} className="hover:text-slate-900 cursor-pointer">
            Collaborators
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={requireAuth}
              style={{ backgroundColor: '#0f9f59' }}
              className="text-xs font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-90 shadow-sm shadow-emerald-200 cursor-pointer transition-opacity"
            >
              Go to Workspace
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{ backgroundColor: '#0f9f59' }}
                className="text-xs font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-90 shadow-sm shadow-emerald-200 cursor-pointer transition-opacity"
              >
                Sign up free
              </button>
            </>
          )}
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="px-8 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0f9f59] bg-emerald-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Where ideas find their people
        </span>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mt-6 leading-tight">
          Build what matters,<br /> with the right people.
        </h1>

        <p className="text-slate-500 text-base mt-5 max-w-xl mx-auto">
          Explore real projects across climate, health, education and more — then publish your
          own idea and let collaborators come to you.
        </p>

        <div className="flex items-center justify-center gap-4 mt-9">
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:border-slate-300 px-6 py-3.5 rounded-xl cursor-pointer transition-colors"
          >
            <Search className="w-4 h-4" />
            Explore projects
          </button>
          <button
            type="button"
            onClick={requireAuth}
            style={{ backgroundColor: '#0f9f59' }}
            className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3.5 rounded-xl hover:opacity-90 shadow-sm shadow-emerald-200 cursor-pointer transition-opacity"
          >
            Publish a project
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ================= FEATURED & LIVE PROJECTS ================= */}
      <section className="px-8 py-14 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
              {hasAnyFeatured ? 'Featured & Live on Project Nexus' : 'Live on Project Nexus'}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Explore what people are building
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="text-xs font-semibold text-[#0f9f59] hover:underline cursor-pointer shrink-0"
          >
            View all →
          </button>
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-60 rounded-2xl border border-slate-100 bg-slate-50/70 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id || project.title}
                project={project}
                onProtectedClick={requireAuth}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Free to browse.{' '}
          <button type="button" onClick={() => navigate('/signup')} className="text-[#0f9f59] font-semibold cursor-pointer">
            Sign up
          </button>{' '}
          to save projects, message founders, or publish your own.
        </p>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="px-8 py-16 bg-slate-50/70 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Three steps to your next project</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0f9f59]" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">STEP {i + 1}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{step.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="px-8 py-16 max-w-5xl mx-auto">
        <div className="bg-[#0f9f59] rounded-3xl px-10 py-14 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-14 -left-10 w-48 h-48 bg-white/10 rounded-full" />
          <h2 className="text-3xl md:text-4xl font-bold text-white relative">
            Got an idea worth building?
          </h2>
          <p className="text-emerald-50 text-sm mt-3 relative">
            Publish it in minutes and start matching with collaborators today.
          </p>
          <button
            type="button"
            onClick={requireAuth}
            className="mt-7 inline-flex items-center gap-2 bg-white text-[#0f9f59] text-sm font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 cursor-pointer relative shadow-lg"
          >
            Publish your project
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="px-8 py-8 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 Project Nexus. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-600">Privacy</a>
          <a href="#" className="hover:text-slate-600">Terms</a>
          <a href="#" className="hover:text-slate-600">Contact</a>
        </div>
      </footer>
    </div>
  );
}