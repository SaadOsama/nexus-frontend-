import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminReview from '../../../pages/user/AdminOverview/AdminProjectDetail.jsx';

const API_BASE = (
  import.meta.env.VITE_API_BASE || 'https://nexus-backend-fbcotg.fly.dev/api'
).replace(/\/+$/, '');

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// Sprint S1-04: the 7 stages, in order.
const STAGES = [
  'Idea',
  'Research',
  'Prototype',
  'MVP',
  'Early Revenue',
  'Scaling',
  'Established Business',
];

const FUNDING_LABELS = {
  'not-seeking': 'Not seeking funding',
  'under-10k': 'Under $10k',
  '10k-50k': '$10k to $50k',
  '50k-250k': '$50k to $250k',
  '250k-1m': '$250k to $1M',
  'over-1m': 'Over $1M',
};

const STATUS_STYLES = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  pending: { label: 'Pending review', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  changes_requested: { label: 'Changes requested', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
  published: { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Token: change the key list if your login saves it under another name.
function getAuthToken() {
  const keys = ['token', 'accessToken', 'authToken', 'jwt', 'nexus_token'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value.replace(/^"|"$/g, '');
  }
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token || user?.accessToken || null;
  } catch {
    return null;
  }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

// First non-empty value from several possible field names (camelCase / snake_case).
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '' && !(Array.isArray(v) && v.length === 0)) {
      return v;
    }
  }
  return null;
};

// Tags can arrive as an array or as a "a, b, c" string.
const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const normaliseStage = (s) => (s === 'Growth' ? 'Scaling' : s); // sprint decision #4

const normaliseStatus = (s) => {
  const v = String(s || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (v === 'approved') return 'published';
  if (v === 'pending_review') return 'pending';
  return v;
};

const safeUrl = (value) => {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

const isFeaturedNow = (p) => {
  // The API already applies the expiry date to is_featured, so trust it when it is there.
  if (p?.is_featured !== undefined && p?.is_featured !== null) return Number(p.is_featured) === 1;
  if (!p?.featured && !p?.isFeatured && !p?.is_featured) return false;
  const until = pick(p, 'featuredUntil', 'featured_until');
  return !until || new Date(until).getTime() > Date.now();
};

const formatDate = (value, withTime = false) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return withTime
    ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// 'YYYY-MM-DD' or an ISO string -> local calendar day, no timezone shift.
const formatDay = (value) => {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return formatDate(value);
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const ACTION_LABELS = {
  approve: 'Approved',
  approved: 'Approved',
  request_changes: 'Requested changes',
  changes_requested: 'Requested changes',
  reject: 'Rejected',
  rejected: 'Rejected',
  unpublish: 'Unpublished',
  unpublished: 'Unpublished',
  submit: 'Submitted',
  submitted: 'Submitted',
  resubmit: 'Resubmitted',
};


// True when the logged-in account is an admin (checks saved user, then the token itself).
function isAdminSession() {
  const isAdminRole = (o) => String(o?.role || '').toLowerCase() === 'admin' || o?.isAdmin === true;
  try {
    if (isAdminRole(JSON.parse(localStorage.getItem('user') || 'null'))) return true;
  } catch {
    /* ignore */
  }
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return isAdminRole(payload);
  } catch {
    return false;
  }
}


/* ------------------------------------------------------------------ */
/* ADMIN ENDPOINTS: change these paths to match your backend.          */
/* Each one is called as PATCH {API_BASE}{path} with { note, reason }. */
/* ------------------------------------------------------------------ */
const ADMIN_PATH = {
  approve: (id) => `/admin/projects/${id}/approve`,
  request_changes: (id) => `/admin/projects/${id}/request-changes`,
  reject: (id) => `/admin/projects/${id}/reject`,
  unpublish: (id) => `/admin/projects/${id}/unpublish`,
};

// Featured toggle (S1-08). Real backend route (routes/projectRoutes.js):
// PATCH /api/projects/admin/featured/:id   body: { featured: boolean, featured_until: 'YYYY-MM-DD' | null }
const FEATURE_URL = (id) => `/projects/admin/featured/${id}`;

// Text box that opens when the admin picks a decision that needs a written note.
const NOTE_MODES = {
  request_changes: {
    title: 'Request changes',
    label: 'Note to owner',
    hint: 'Say what needs to change. The owner sees this note and can edit and resubmit.',
    confirm: 'Send note',
    done: 'Changes requested. The owner has been notified.',
  },
  reject: {
    title: 'Reject project',
    label: 'Reason for rejection',
    hint: 'The owner sees this reason.',
    confirm: 'Reject project',
    done: 'Project rejected. The owner has been notified.',
  },
  unpublish: {
    title: 'Unpublish project',
    label: 'Reason for unpublishing',
    hint: 'The project goes back to "Changes requested" and this reason becomes the note.',
    confirm: 'Unpublish project',
    done: 'Project unpublished. The owner has been notified.',
  },
};


/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function TagList({ items }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
          {t}
        </li>
      ))}
    </ul>
  );
}

function StageTracker({ stage }) {
  const index = STAGES.indexOf(stage);
  if (index === -1) return null;
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label={`Stage ${index + 1} of ${STAGES.length}: ${stage}`}>
        {STAGES.map((s, i) => (
          <div
            key={s}
            title={s}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-emerald-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Stage {index + 1} of {STAGES.length}
      </p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse p-4 sm:p-6" aria-busy="true" aria-label="Loading project">
      <div className="mb-6 h-4 w-20 rounded bg-gray-200" />
      <div className="mb-3 h-9 w-3/4 rounded bg-gray-200" />
      <div className="mb-8 h-5 w-1/2 rounded bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 rounded-2xl bg-gray-100" />
          <div className="h-56 rounded-2xl bg-gray-100" />
        </div>
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

function MessageScreen({ title, text, action }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mb-6 text-gray-600">{text}</p>
      <div className="flex justify-center gap-3">
        {action}
        <Link
          to="/discover"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse projects
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
    {title && <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2>}
    {children}
  </section>
);

const Empty = () => <span className="text-gray-400">Not provided</span>;

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="break-words text-sm text-gray-900 sm:col-span-2">{children || <Empty />}</dd>
    </div>
  );
}

const Tags = ({ items }) =>
  items.length ? (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800">
          {t}
        </li>
      ))}
    </ul>
  ) : null;

const LinkOut = ({ href }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
      {href} ↗
    </a>
  ) : null;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [mode, setMode] = useState(null); // null | request_changes | reject | unpublish
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [flash, setFlash] = useState('');
  const [featureUntil, setFeatureUntil] = useState('');
  const [featureBusy, setFeatureBusy] = useState(false);
  const [featureError, setFeatureError] = useState('');

  const headers = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const res = await axios.get(`${API_BASE}/projects/${id}`, { headers: headers() });
      setProject(res.data?.project || res.data?.data || res.data);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, body, doneMessage) => {
    try {
      setBusy(true);
      setFormError('');
      await axios.patch(`${API_BASE}${ADMIN_PATH[action](id)}`, body, { headers: headers() });
      setMode(null);
      setText('');
      setFlash(doneMessage);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitNote = () => {
    const value = text.trim();
    if (!value) return setFormError(`${NOTE_MODES[mode].label} is required.`);
    if (value.length > 1000) return setFormError('Keep it under 1000 characters.');
    run(mode, { note: value, reason: value }, NOTE_MODES[mode].done);
  };

  const setFeatured = async (flag) => {
    setFeatureError('');
    const end = flag && featureUntil ? new Date(`${featureUntil}T23:59:59`) : null;
    if (end && (Number.isNaN(end.getTime()) || end.getTime() <= Date.now())) {
      return setFeatureError('Pick a date in the future, or leave it empty for no expiry.');
    }
    try {
      setFeatureBusy(true);
      const res = await axios.patch(
        `${API_BASE}${FEATURE_URL(id)}`,
        { featured: flag, featured_until: flag && featureUntil ? featureUntil : null },
        { headers: headers() }
      );
      setFlash(res.data?.message || (flag ? 'Project is now featured.' : 'Removed from featured.'));
      setFeatureUntil('');
      await load();
    } catch (err) {
      const code = err.response?.status;
      setFeatureError(
        err.response?.data?.message ||
          (code === 403
            ? 'Only admins can change Featured.'
            : code === 404 || code === 405
            ? 'The server has no Featured route yet. The backend needs a feature endpoint.'
            : 'Could not update Featured. Try again.')
      );
    } finally {
      setFeatureBusy(false);
    }
  };

  if (loading && !project) {
    return <div className="p-8 text-center text-gray-500" aria-busy="true">Loading project…</div>;
  }

  if (failed || !project) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Could not load this project</h1>
        <p className="mb-5 text-gray-600">It may have been deleted, or the request failed.</p>
        <div className="flex justify-center gap-3">
          <button onClick={load} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Try again
          </button>
          <Link to="/admin/projects" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- data ---------- */
  const owner = project.owner || project.user || {};
  const ownerName = pick(owner, 'fullName', 'full_name', 'name') || pick(project, 'ownerName', 'owner_name');
  const ownerEmail = pick(owner, 'email') || pick(project, 'ownerEmail', 'owner_email');
  const status = normaliseStatus(project.status);
  const st = STATUS_STYLES[status] || { label: project.status || 'Unknown', cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  const stageRaw = pick(project, 'stage');
  const stage = stageRaw === 'Growth' ? 'Scaling' : stageRaw;
  const funding = pick(project, 'fundingRequirement', 'funding_requirement', 'funding');
  const teamSize = pick(project, 'teamSize', 'team_size');
  const lastNote = pick(project, 'adminNote', 'admin_note', 'reviewNote', 'review_note', 'rejectionReason', 'admin_response');
  const history = (pick(project, 'history', 'reviewHistory', 'review_history', 'decisions') || []).slice().reverse();

  const noteMode = mode ? NOTE_MODES[mode] : null;
  const featuredNow = isFeaturedNow(project);
  const featuredUntilValue = pick(project, 'featuredUntil', 'featured_until');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full p-4 sm:p-6" style={{ maxWidth: 1040, margin: '0 auto' }}>
      <Link to="/admin/projects" className="mb-5 inline-block text-sm font-medium text-emerald-700 hover:underline">
        ← Back to projects
      </Link>

      {/* Header */}
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
          <span className="text-xs text-gray-500">Admin review · Project #{id}</span>
        </div>
        <h1 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">{project.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          By <span className="font-medium text-gray-900">{ownerName || 'Unknown'}</span>
          {ownerEmail && <> · {ownerEmail}</>}
          {formatDate(pick(project, 'createdAt', 'created_at')) && <> · Created {formatDate(pick(project, 'createdAt', 'created_at'))}</>}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Decision panel: first on mobile, right column on desktop */}
        <aside className="space-y-5 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <Card title="Decision">
            {flash && (
              <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {flash}
              </p>
            )}

            {/* Pending: the three review actions */}
            {status === 'pending' && !mode && (
              <div className="flex flex-col gap-2">
                <button
                  disabled={busy}
                  onClick={() => run('approve', {}, 'Project approved and published.')}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? 'Working…' : 'Approve'}
                </button>
                <button
                  disabled={busy}
                  onClick={() => { setMode('request_changes'); setFormError(''); setFlash(''); }}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Request changes
                </button>
                <button
                  disabled={busy}
                  onClick={() => { setMode('reject'); setFormError(''); setFlash(''); }}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Reject
                </button>
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
              </div>
            )}

            {/* Published: only unpublish */}
            {status === 'published' && !mode && (
              <div>
                <p className="mb-3 text-sm text-gray-600">This project is live. Unpublishing needs a reason for the owner.</p>
                <button
                  onClick={() => { setMode('unpublish'); setFormError(''); setFlash(''); }}
                  className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Unpublish
                </button>
              </div>
            )}

            {/* Waiting states: nothing for the admin to do */}
            {status === 'draft' && !mode && (
              <p className="text-sm text-gray-600">The owner is still working on this draft. There is nothing to review yet.</p>
            )}
            {(status === 'changes_requested' || status === 'rejected') && !mode && (
              <p className="text-sm text-gray-600">Waiting for the owner to edit and resubmit. It will return to the review queue.</p>
            )}

            {/* Note form (required text) */}
            {noteMode && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">{noteMode.title}</h3>
                <p className="mb-2 text-xs text-gray-500">{noteMode.hint}</p>
                <label htmlFor="admin-note" className="sr-only">{noteMode.label}</label>
                <textarea
                  id="admin-note"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder={noteMode.label}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span role="alert" className="text-red-600">{formError}</span>
                  <span>{text.length}/1000</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busy}
                    onClick={submitNote}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? 'Working…' : noteMode.confirm}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => { setMode(null); setText(''); setFormError(''); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>

          {status === 'published' && (
            <Card title="Featured placement">
              {featuredNow ? (
                <>
                  <p className="mb-3 text-sm text-gray-700">
                    <span className="font-semibold text-amber-700">★ Featured</span>{' '}
                    {featuredUntilValue ? `until ${formatDay(featuredUntilValue)}` : 'with no expiry'}. It shows a badge and
                    appears first in Discover and on the landing page.
                  </p>
                  <button
                    disabled={featureBusy}
                    onClick={() => setFeatured(false)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {featureBusy ? 'Working…' : 'Remove from featured'}
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-3 text-sm text-gray-600">
                    Featured projects get a badge and are shown first. Up to 6 projects can be featured at once.
                  </p>
                  <label htmlFor="feature-until" className="mb-1 block text-xs text-gray-500">
                    Feature until (optional)
                  </label>
                  <input
                    id="feature-until"
                    type="date"
                    min={tomorrow}
                    value={featureUntil}
                    onChange={(e) => setFeatureUntil(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    disabled={featureBusy}
                    onClick={() => setFeatured(true)}
                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {featureBusy ? 'Working…' : '★ Feature this project'}
                  </button>
                </>
              )}
              {featureError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {featureError}
                </p>
              )}
            </Card>
          )}

          {lastNote && status !== 'published' && (
            <Card title="Last note to owner">
              <p className="whitespace-pre-line text-sm text-gray-700">{lastNote}</p>
            </Card>
          )}

          <Card title="History">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No decisions yet.</p>
            ) : (
              <ol className="space-y-4">
                {history.map((h, i) => {
                  const action = String(h.action || h.type || '').toLowerCase();
                  const by = pick(h, 'adminName', 'admin_name', 'by', 'actor') || pick(h.admin || {}, 'name', 'fullName');
                  return (
                    <li key={h.id || i} className="border-l-2 border-gray-200 pl-3">
                      <p className="text-sm font-medium text-gray-900">{ACTION_LABELS[action] || h.action || 'Updated'}</p>
                      <p className="text-xs text-gray-500">
                        {[by, formatDate(pick(h, 'createdAt', 'created_at', 'at', 'time'), true)].filter(Boolean).join(' · ')}
                      </p>
                      {pick(h, 'note', 'reason') && (
                        <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{pick(h, 'note', 'reason')}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </aside>

        {/* Every field, including empty ones, so the admin sees what was not filled */}
        <div className="space-y-5 lg:order-1 lg:col-span-2">
          <Card title="Basics">
            <dl className="divide-y divide-gray-100">
              <Row label="Summary"><span className="whitespace-pre-line">{pick(project, 'description', 'summary')}</span></Row>
              <Row label="Industry">{pick(project, 'industry')}</Row>
              <Row label="Country">{pick(project, 'country')}</Row>
              <Row label="Stage">
                {stage && (
                  <>
                    {stage}
                    {!STAGES.includes(stage) && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">not one of the 7 stages</span>
                    )}
                  </>
                )}
              </Row>
            </dl>
          </Card>

          <Card title="Story">
            <dl className="divide-y divide-gray-100">
              <Row label="Problem statement"><span className="whitespace-pre-line">{pick(project, 'problemStatement', 'problem_statement')}</span></Row>
              <Row label="Detailed description"><span className="whitespace-pre-line">{pick(project, 'detailedDescription', 'detailed_description')}</span></Row>
            </dl>
          </Card>

          <Card title="Needs and links">
            <dl className="divide-y divide-gray-100">
              <Row label="Technology stack"><Tags items={toList(pick(project, 'techStack', 'tech_stack', 'technologyStack', 'technology_stack'))} /></Row>
              <Row label="Required skills"><Tags items={toList(pick(project, 'requiredSkills', 'required_skills', 'skills'))} /></Row>
              <Row label="Funding requirement">{funding && (FUNDING_LABELS[funding] || funding)}</Row>
              <Row label="Team size">{teamSize && `${teamSize} ${Number(teamSize) === 1 ? 'person' : 'people'}`}</Row>
              <Row label="Website"><LinkOut href={safeUrl(pick(project, 'website', 'websiteUrl', 'website_url'))} /></Row>
              <Row label="Pitch deck / demo"><LinkOut href={safeUrl(pick(project, 'pitchDeck', 'pitch_deck', 'demoVideo', 'demo_video', 'pitchDeckUrl'))} /></Row>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PublicView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState(null); // 'notfound' | 'failed'
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  const token = getAuthToken();
  const user = getStoredUser();
  const isLoggedIn = Boolean(token);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setErrorKind(null);
      const res = await axios.get(`${API_BASE}/projects/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProject(res.data?.project || res.data?.data || res.data);
    } catch (err) {
      const status = err.response?.status;
      // Unpublished / unknown / not allowed all look the same to the visitor (S1-03).
      setErrorKind([401, 403, 404].includes(status) ? 'notfound' : 'failed');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id) fetchProject();
  }, [id, fetchProject]);

  useEffect(() => {
    if (project?.title) document.title = `${project.title} · Nexus`;
    return () => {
      document.title = 'Nexus';
    };
  }, [project?.title]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const view = useMemo(() => {
    if (!project) return null;
    const owner = project.owner || project.user || {};
    const ownerName =
      pick(owner, 'fullName', 'full_name', 'name') || pick(project, 'ownerName', 'owner_name') || null;
    const ownerId = pick(owner, 'id', '_id') ?? pick(project, 'ownerId', 'owner_id', 'userId', 'user_id');
    const me = user?.id ?? user?._id;
    const isOwner = me != null && ownerId != null && String(me) === String(ownerId);
    const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
    const status = normaliseStatus(project.status);

    return {
      title: project.title,
      summary: pick(project, 'description', 'summary'),
      problem: pick(project, 'problemStatement', 'problem_statement'),
      details: pick(project, 'detailedDescription', 'detailed_description'),
      tech: toList(pick(project, 'techStack', 'tech_stack', 'technologyStack', 'technology_stack')),
      skills: toList(pick(project, 'requiredSkills', 'required_skills', 'skills')),
      funding: pick(project, 'fundingRequirement', 'funding_requirement', 'funding'),
      website: safeUrl(pick(project, 'website', 'websiteUrl', 'website_url')),
      deck: safeUrl(pick(project, 'pitchDeck', 'pitch_deck', 'demoVideo', 'demo_video', 'pitchDeckUrl')),
      teamSize: pick(project, 'teamSize', 'team_size'),
      industry: pick(project, 'industry'),
      country: pick(project, 'country'),
      stage: normaliseStage(pick(project, 'stage')),
      created: formatDate(pick(project, 'createdAt', 'created_at')),
      adminNote: pick(project, 'adminNote', 'admin_note', 'reviewNote', 'review_note', 'rejectionReason', 'admin_response'),
      ownerName,
      featured: isFeaturedNow(project),
      status,
      isOwner,
      isAdmin,
    };
  }, [project, user]);

  /* ---------- states ---------- */

  if (loading) return <PageSkeleton />;

  if (errorKind === 'notfound' || (!project && errorKind !== 'failed')) {
    return (
      <MessageScreen
        title="Project not found"
        text="This project does not exist, or it is not published yet."
        action={
          !isLoggedIn && (
            <Link
              to="/login"
              state={{ from: location }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Log in
            </Link>
          )
        }
      />
    );
  }

  if (errorKind === 'failed') {
    return (
      <MessageScreen
        title="Could not load this project"
        text="Check your connection and try again."
        action={
          <button
            onClick={fetchProject}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Try again
          </button>
        }
      />
    );
  }

  const statusInfo = STATUS_STYLES[view.status];
  const showStatusBanner = (view.isOwner || view.isAdmin) && view.status && view.status !== 'published';

  const handleRequestCollaboration = () => {
    // TODO: connect to your existing collaboration request flow/modal.
    navigate('/discover');
  };

  const cta = isLoggedIn ? (
    view.isOwner ? null : (
      <button
        onClick={handleRequestCollaboration}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Request collaboration
      </button>
    )
  ) : (
    <Link
      to="/login"
      state={{ from: location }}
      className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      Log in to request collaboration
    </Link>
  );

  const facts = [
    ['Industry', view.industry],
    ['Stage', view.stage],
    ['Country', view.country],
    ['Funding', view.funding && (FUNDING_LABELS[view.funding] || view.funding)],
    ['Team size', view.teamSize && `${view.teamSize} ${Number(view.teamSize) === 1 ? 'person' : 'people'}`],
    ['Posted', view.created],
  ].filter(([, v]) => v);

  return (
    <div className="mx-auto w-full p-4 sm:p-6" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/discover'))}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back
        </button>

        <div className="relative">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
          </button>
          <span
            role="status"
            aria-live="polite"
            className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white transition-opacity ${
              copied ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {copied ? 'Link copied' : ''}
          </span>
        </div>
      </div>

      {/* Status banner (owner/admin only) with admin note */}
      {showStatusBanner && (
        <div className={`mb-5 rounded-xl border p-4 ${statusInfo?.cls || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <p className="text-sm font-semibold">
            {statusInfo?.label || 'Not published'}
            {view.isOwner && ' · only you and admins can see this page'}
          </p>
          {view.adminNote && (
            <p className="mt-1 whitespace-pre-line text-sm">
              <span className="font-medium">Note from admin: </span>
              {view.adminNote}
            </p>
          )}
        </div>
      )}

      {/* 1. What is this project? */}
      <header className="mb-6">
        {view.featured && (
          <div className="mb-3">
            <Badge className="border-amber-200 bg-amber-50 text-amber-800">★ Featured</Badge>
          </div>
        )}
        <h1 className="break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{view.title}</h1>
        {view.ownerName && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
              {initials(view.ownerName)}
            </div>
            <p className="text-sm text-gray-600">
              by <span className="font-medium text-gray-900">{view.ownerName}</span>
            </p>
          </div>
        )}
        {view.summary && (
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-gray-700">{view.summary}</p>
        )}
      </header>

      {/* 2. Key facts */}
      {facts.length > 0 && (
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          {view.stage && STAGES.includes(view.stage) && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <StageTracker stage={view.stage} />
            </div>
          )}
        </section>
      )}

      {/* 3. What do you want to do? */}
      <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        {view.isOwner ? (
          <p className="text-sm text-emerald-900">This is your project. Collaborators will find it in Discover once it is published.</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Want to work on this project?</p>
              <p className="text-sm text-emerald-800">
                {isLoggedIn
                  ? 'Send a request. An admin reviews it before a chat opens with the owner.'
                  : 'Log in first. After you sign in you will come back to this page.'}
              </p>
            </div>
            <div className="sm:w-64 sm:shrink-0">{cta}</div>
          </div>
        )}
      </section>

      {/* Links */}
      {(view.website || view.deck) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {view.website && (
            <a
              href={view.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Visit website ↗
            </a>
          )}
          {view.deck && (
            <a
              href={view.deck}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Pitch deck / demo ↗
            </a>
          )}
        </div>
      )}

      {/* 4. More detail: only sections that have content */}
      <div className="space-y-5">
        {view.problem && (
          <Section title="The problem">
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{view.problem}</p>
          </Section>
        )}
        {view.details && (
          <Section title="About this project">
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{view.details}</p>
          </Section>
        )}
        {view.tech.length > 0 && (
          <Section title="Technology stack">
            <TagList items={view.tech} />
          </Section>
        )}
        {view.skills.length > 0 && (
          <Section title="Skills needed">
            <TagList items={view.skills} />
          </Section>
        )}
      </div>
    </div>
  );
}

// Admins get the review view (all fields + decisions). Everyone else gets the public page.
export default function PublicProjectDetail() {
  return isAdminSession() ? <AdminReview /> : <PublicView />;
}
