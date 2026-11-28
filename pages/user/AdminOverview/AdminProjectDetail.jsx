import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = (
  import.meta.env.VITE_API_BASE || 'https://nexus-backend-fbcotg.fly.dev/api'
).replace(/\/+$/, '');

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

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

// Real backend routes (routes/projectRoutes.js and routes/admin.js):
// POST /api/projects/admin/action/:id   body: { action: 'approve' | 'request_changes' | 'reject', adminNote }
// POST /api/admin/console/projects/:id/unpublish   body: { reason }
// GET  /api/projects/admin/history/:id
// PATCH /api/projects/admin/featured/:id   body: { featured, featured_until }
const ACTION_URL = (id) => `/projects/admin/action/${id}`;
const UNPUBLISH_URL = (id) => `/admin/console/projects/${id}/unpublish`;
const HISTORY_URL = (id) => `/projects/admin/history/${id}`;
const FEATURE_URL = (id) => `/projects/admin/featured/${id}`;

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
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '' && !(Array.isArray(v) && v.length === 0)) {
      return v;
    }
  }
  return null;
};

const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      /* fall through to comma split */
    }
  }
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const normaliseStage = (s) => (s === 'Growth' ? 'Scaling' : s);

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

const isFeaturedNow = (p) => {
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

const formatDay = (value) => {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return formatDate(value);
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

/* ------------------------------------------------------------------ */
/* Queue helpers (used by the admin projects list)                     */
/* Backend order: newest submitted_at first, so resubmitted projects   */
/* sit at the top of the pending queue.                                */
/* ------------------------------------------------------------------ */

export const sortReviewQueue = (projects) =>
  projects.slice().sort((a, b) => {
    const pa = normaliseStatus(a.status) === 'pending' ? 0 : 1;
    const pb = normaliseStatus(b.status) === 'pending' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (pa === 1) return 0;
    const ta = new Date(a.submitted_at || a.submittedAt || a.created_at || 0).getTime();
    const tb = new Date(b.submitted_at || b.submittedAt || b.created_at || 0).getTime();
    return tb - ta;
  });

export function WaitingChip({ project }) {
  if (normaliseStatus(project.status) !== 'pending') return null;
  const since = new Date(project.submitted_at || project.submittedAt || project.created_at || 0).getTime();
  if (!since) return null;
  const days = Math.floor((Date.now() - since) / 86400000);
  const urgent = days >= 3;
  return (
    <Badge className={urgent ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-600'}>
      {days < 1 ? 'Waiting today' : `Waiting ${days} day${days === 1 ? '' : 's'}`}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [history, setHistory] = useState([]);
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
    // Review history has its own route. If it fails the page still works.
    try {
      const h = await axios.get(`${API_BASE}${HISTORY_URL(id)}`, { headers: headers() });
      const list = h.data?.data || h.data?.history || h.data?.rows || (Array.isArray(h.data) ? h.data : []);
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, note, doneMessage) => {
    try {
      setBusy(true);
      setFormError('');
      if (action === 'unpublish') {
        await axios.post(`${API_BASE}${UNPUBLISH_URL(id)}`, { reason: note }, { headers: headers() });
      } else {
        await axios.post(`${API_BASE}${ACTION_URL(id)}`, { action, adminNote: note }, { headers: headers() });
      }
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
    run(mode, value, NOTE_MODES[mode].done);
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

  const stageRaw = normaliseStage(pick(project, 'stage'));
  const industry = pick(project, 'industry', 'category');
  const country = pick(project, 'country', 'location');
  const summary = pick(project, 'description', 'summary');
  const problem = pick(project, 'problemStatement', 'problem_statement');
  const details = pick(project, 'detailedDescription', 'detailed_description');
  const lookingFor = pick(project, 'lookingFor', 'looking_for');
  const techStack = toList(pick(project, 'techStack', 'tech_stack', 'technologyStack', 'technology_stack'));
  const skills = toList(pick(project, 'requiredSkills', 'required_skills', 'skills'));
  const tags = toList(pick(project, 'tags'));
  const funding = pick(project, 'fundingRequirement', 'funding_requirement', 'funding');
  const teamSize = pick(project, 'teamSize', 'team_size');
  const website = safeUrl(pick(project, 'website', 'websiteUrl', 'website_url'));
  const pitchDeck = safeUrl(pick(project, 'pitchDeck', 'pitch_deck', 'pitchDeckUrl', 'pitch_deck_url', 'demoVideo', 'demo_video'));
  const submittedAt = pick(project, 'submittedAt', 'submitted_at', 'createdAt', 'created_at');
  const lastNote = pick(project, 'adminNote', 'admin_note', 'reviewNote', 'review_note', 'rejectionReason', 'admin_response');

  // Pending with an earlier decision in the log means the owner edited and resubmitted.
  const isResubmission =
    status === 'pending' &&
    history.some((h) => ['request_changes', 'reject', 'unpublish'].includes(String(h.action || '').toLowerCase()));

  const canDecide = status === 'pending';
  const canUnpublish = status === 'published';
  const noteMode = mode ? NOTE_MODES[mode] : null;
  const featuredNow = isFeaturedNow(project);
  const featuredUntilValue = pick(project, 'featuredUntil', 'featured_until');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const openNote = (m) => {
    setMode(m);
    setText('');
    setFormError('');
    setFlash('');
  };

  return (
    <div className="mx-auto w-full p-4 sm:p-6" style={{ maxWidth: 1040, margin: '0 auto' }}>
      <Link to="/admin/projects" className="mb-5 inline-block text-sm font-medium text-emerald-700 hover:underline">
        ← Back to projects
      </Link>

      {flash && (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className={st.cls}>{st.label}</Badge>
          {isResubmission && <Badge className="border-sky-200 bg-sky-50 text-sky-700">Resubmitted</Badge>}
          {featuredNow && <Badge className="border-yellow-200 bg-yellow-50 text-yellow-800">Featured</Badge>}
          {industry && <Badge className="border-gray-200 bg-white text-gray-600">{industry}</Badge>}
        </div>
        <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">{project.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {ownerName || 'Unknown owner'}
          {ownerEmail ? ` (${ownerEmail})` : ''}
          {submittedAt ? `, submitted ${formatDate(submittedAt, true)}` : ''}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Left: every field, empty ones included ---------- */}
        <div className="space-y-5 lg:col-span-2">
          <Card title="Basics">
            <dl className="divide-y divide-gray-100">
              <Row label="Summary">{summary && <span className="whitespace-pre-line">{summary}</span>}</Row>
              <Row label="Industry">{industry}</Row>
              <Row label="Country">{country}</Row>
              <Row label="Looking for">{lookingFor && <span className="whitespace-pre-line">{lookingFor}</span>}</Row>
              <Row label="Tags">{tags.length ? <Tags items={tags} /> : null}</Row>
            </dl>
          </Card>

          <Card title="Stage">
            {stageRaw ? (
              <>
                <StageTracker stage={stageRaw} />
                <p className="mt-1 text-sm font-medium text-gray-900">{stageRaw}</p>
                {STAGES.indexOf(stageRaw) === -1 && (
                  <p className="mt-1 text-xs text-amber-700">Not one of the 7 stages.</p>
                )}
              </>
            ) : (
              <Empty />
            )}
          </Card>

          <Card title="Story">
            <dl className="divide-y divide-gray-100">
              <Row label="Problem statement">{problem && <span className="whitespace-pre-line">{problem}</span>}</Row>
              <Row label="Detailed description">{details && <span className="whitespace-pre-line">{details}</span>}</Row>
            </dl>
          </Card>

          <Card title="Needs and links">
            <dl className="divide-y divide-gray-100">
              <Row label="Tech stack">{techStack.length ? <Tags items={techStack} /> : null}</Row>
              <Row label="Required skills">{skills.length ? <Tags items={skills} /> : null}</Row>
              <Row label="Funding">{funding && (FUNDING_LABELS[funding] || funding)}</Row>
              <Row label="Team size">{teamSize && `${teamSize} ${Number(teamSize) === 1 ? 'person' : 'people'}`}</Row>
              <Row label="Website"><LinkOut href={website} /></Row>
              <Row label="Pitch deck / demo"><LinkOut href={pitchDeck} /></Row>
            </dl>
          </Card>

          <Card title="Review history">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No decisions yet. Every approval, request for changes and rejection is logged here.</p>
            ) : (
              <ol className="space-y-4">
                {history.map((h, i) => {
                  const action = String(pick(h, 'action', 'decision', 'status') || '').toLowerCase();
                  const label = ACTION_LABELS[action] || pick(h, 'action', 'decision', 'status') || 'Updated';
                  const note = pick(h, 'note', 'reason', 'message', 'comment');
                  const who = pick(h, 'adminName', 'admin_name', 'actorName', 'actor_name', 'by');
                  const when = pick(h, 'created_at', 'createdAt', 'at', 'date', 'timestamp');
                  return (
                    <li key={h.id ?? i} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <span className="text-xs text-gray-400">
                          {who ? `${who}, ` : ''}
                          {formatDate(when, true) || ''}
                        </span>
                      </div>
                      {note && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{note}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        {/* ---------- Right: decision panel ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <Card title="Decision">
            {lastNote && (status === 'changes_requested' || status === 'rejected') && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold text-gray-700">Last note to owner</p>
                <p className="mt-0.5 whitespace-pre-line text-xs text-gray-600">{lastNote}</p>
              </div>
            )}

            {!noteMode && canDecide && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run('approve', '', 'Project published. The owner has been notified.')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Approve and publish'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openNote('request_changes')}
                  className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                >
                  Request changes
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openNote('reject')}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
              </div>
            )}

            {!noteMode && canUnpublish && (
              <div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openNote('unpublish')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Unpublish
                </button>
                {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
              </div>
            )}

            {!noteMode && !canDecide && !canUnpublish && (
              <p className="text-sm text-gray-500">
                {status === 'draft'
                  ? 'This project is still a draft. It can be reviewed once the owner submits it.'
                  : 'Waiting for the owner to edit and resubmit. No decision needed now.'}
              </p>
            )}

            {noteMode && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{noteMode.title}</h3>
                <label htmlFor="review-note" className="mt-3 block text-xs font-medium text-gray-700">
                  {noteMode.label} (required)
                </label>
                <textarea
                  id="review-note"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (formError) setFormError('');
                  }}
                  rows={5}
                  maxLength={1000}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-500">{noteMode.hint}</p>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-red-600">{formError}</span>
                  <span className="text-gray-400">{text.length}/1000</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !text.trim()}
                    onClick={submitNote}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Working…' : noteMode.confirm}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode(null);
                      setText('');
                      setFormError('');
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>

          {status === 'published' && (
            <Card title="Featured">
              <p className="mb-3 text-sm text-gray-600">
                {featuredNow
                  ? featuredUntilValue
                    ? `Featured until ${formatDay(featuredUntilValue)}.`
                    : 'Featured with no expiry.'
                  : 'Not featured.'}
              </p>
              {!featuredNow && (
                <>
                  <label htmlFor="feature-until" className="block text-xs font-medium text-gray-700">
                    Expiry date (optional)
                  </label>
                  <input
                    id="feature-until"
                    type="date"
                    min={tomorrow}
                    value={featureUntil}
                    onChange={(e) => setFeatureUntil(e.target.value)}
                    className="mb-3 mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </>
              )}
              <button
                type="button"
                disabled={featureBusy}
                onClick={() => setFeatured(!featuredNow)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {featureBusy ? 'Working…' : featuredNow ? 'Remove from featured' : 'Feature this project'}
              </button>
              {featureError && <p className="mt-2 text-xs text-red-600">{featureError}</p>}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AdminProjectDetail;
