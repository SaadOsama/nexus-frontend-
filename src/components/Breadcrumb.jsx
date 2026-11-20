import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LABELS = {
  overview: 'Overview',
  discover: 'Discover',
  'my-projects': 'My Projects',
  messages: 'Messages',
  notifications: 'Notifications',
  profile: 'Profile',
  projects: 'Projects',
  admin: 'Admin',
  users: 'Users',
  queue: 'Review queue',
};

// URL ke wo hisse jo breadcrumb mein nahi dikhane (agar routes /user/... se shuru hon)
const SKIP = new Set(['user']);

const prettify = (seg) =>
  LABELS[seg] ||
  (/^\d+$/.test(seg) ? 'Details' : seg.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()));

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments
    .map((seg, i) => ({ seg, to: '/' + segments.slice(0, i + 1).join('/') }))
    .filter(({ seg }) => !SKIP.has(seg))
    .map(({ seg, to }) => ({ label: prettify(seg), to }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-400">Workspace</span>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={c.to}>
            <span className="text-sm text-slate-300">/</span>
            {isLast ? (
              <span aria-current="page" className="text-sm font-semibold text-slate-500">
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="text-sm font-medium text-slate-400 hover:text-slate-600">
                {c.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}