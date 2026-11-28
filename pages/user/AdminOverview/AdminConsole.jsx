import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WaitingChip } from './AdminProjectDetail.jsx';
import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Users,
  Search,
  Eye,
  ArchiveX,
  UserCheck,
  UserX,
  Star,
  Inbox,
  Activity,
  X,
  ShieldCheck,
} from 'lucide-react';
import api from '@/api/axios';

const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '-');

/* ---------- UI helpers (visual only) ---------- */
const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const statusStyle = (s) => {
  const v = String(s || '').toLowerCase();
  if (v === 'approved' || v === 'published') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (v === 'pending' || v === 'pending_review') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (v === 'changes_requested') return 'bg-orange-50 text-orange-700 border-orange-100';
  if (v === 'rejected') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const statusLabel = (s) => String(s || 'unknown').replace(/_/g, ' ');

function Badge({ cls, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}
    >
      {children}
    </span>
  );
}

function PageHeader({ title, subtitle, count }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {typeof count === 'number' && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#0f9f59]">
            {count}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#0f9f59] focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:w-72"
      />
    </div>
  );
}

function TableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100/80" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-slate-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Modal({ title, children, onClose }) {
  // UI: close with Esc key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        <button onClick={onClose} className="mt-3 text-sm font-semibold text-slate-500 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------- Layout + left navigation ---------- */
export function AdminLayout() {
  const links = [
    ['/admin', 'Overview', true, LayoutDashboard],
    ['/admin/review', 'Review queue', false, ClipboardList],
    ['/admin/projects', 'Projects', false, FolderKanban],
    ['/admin/users', 'Users', false, Users],
  ];
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#f6faf8] to-slate-50">
      <nav className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block md:sticky md:top-0 md:h-screen">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">Admin</h2>
        </div>
        {links.map(([to, label, end, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive ? 'bg-emerald-50 text-[#0f9f59]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#0f9f59]" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        {/* Mobile top navigation */}
        <nav className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white p-2 md:hidden">
          {links.map(([to, label, end, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive ? 'bg-emerald-50 text-[#0f9f59]' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ---------- Activity panel (Overview mein lagayein) ---------- */
export function ActivityPanel() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/admin/console/activity').then((r) => setItems(r.data?.data || [])).catch(() => {});
  }, []);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Activity className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Recent admin activity</h3>
      </div>
      {!items.length && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-300">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-400">No activity yet.</p>
        </div>
      )}
      <ul>
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(a.adminName || 'Admin')}
            </div>
            <div className="min-w-0">
              <div>
                <span className="font-semibold">{a.adminName || 'Admin'}</span>: {a.summary}
              </div>
              <div className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Projects table ---------- */
export function ProjectsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const dq = useDebounced(q);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/console/projects', { params: { q: dq, status } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [dq, status]);
  useEffect(load, [load]);

  // Review queue: pending first, oldest submission at the top. Other statuses keep the server order.
  const isPending = (p) => String(p.status || '').startsWith('pending');
  const queueTime = (p) => new Date(p.submitted_at || p.submittedAt || p.created_at || 0).getTime();
  const queue = [...rows].sort((a, b) => {
    if (isPending(a) !== isPending(b)) return isPending(a) ? -1 : 1;
    return isPending(a) ? queueTime(a) - queueTime(b) : 0;
  });

  const unpublish = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/console/projects/${target.id}/unpublish`, { reason: reason.trim() });
      toast.success('Project unpublished');
      setTarget(null);
      setReason('');
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Search, review and unpublish projects."
        count={loading ? undefined : rows.length}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or owner" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize text-slate-700 shadow-sm transition-all focus:border-[#0f9f59] focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {['all', 'pending', 'approved', 'rejected', 'changes_requested'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && !rows.length ? (
          <TableSkeleton />
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                {['Title', 'Owner', 'Industry', 'Stage', 'Status', 'Featured', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-emerald-50/30">
                  <td className="max-w-[240px] px-4 py-3 font-semibold text-slate-900">
                    <div className="line-clamp-2 break-words">{p.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                        {initials(p.ownerName)}
                      </div>
                      <span className="whitespace-nowrap">{p.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.industry || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.stage || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge cls={statusStyle(p.status)}>{statusLabel(p.status)}</Badge>
                      <WaitingChip project={p} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        p.is_featured ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${p.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                      {p.is_featured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmt(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#0f9f59] transition-all hover:bg-emerald-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> {isPending(p) ? 'Review' : 'View'}
                      </Link>
                      {p.status === 'approved' && (
                        <button
                          onClick={() => { setTarget(p); setReason(''); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
                        >
                          <ArchiveX className="h-3.5 w-3.5" /> Unpublish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon={FolderKanban} text="No projects found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {target && (
        <Modal title={`Unpublish "${target.title}"`} onClose={() => setTarget(null)}>
          <p className="mb-2 text-xs text-slate-500">
            The owner will see this reason and the project returns to Changes requested.
          </p>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm transition-all focus:border-[#0f9f59] focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            disabled={reason.trim().length < 3 || busy}
            onClick={unpublish}
            className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Working...' : 'Unpublish'}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Users table ---------- */
export function UsersPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const dq = useDebounced(q);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/users', { params: { q: dq } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [dq]);
  useEffect(load, [load]);

  const confirm = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/users/${target.id}/status`, { suspended: !target.is_suspended });
      toast.success(target.is_suspended ? 'User reactivated' : 'User suspended');
      setTarget(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Suspend or reactivate accounts."
        count={loading ? undefined : rows.length}
      />
      <div className="mb-4">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && !rows.length ? (
          <TableSkeleton />
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                {['Name', 'Email', 'Role', 'Joined', 'Projects', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 transition-colors hover:bg-emerald-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          u.is_suspended ? 'bg-red-50 text-red-500' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {initials(u.fullName)}
                      </div>
                      <span className="whitespace-nowrap font-semibold text-slate-900">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmt(u.created_at)}</td>
                  <td className="px-4 py-3">{u.project_count}</td>
                  <td className="px-4 py-3">
                    <Badge
                      cls={
                        u.is_suspended
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_suspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      {u.is_suspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' ? (
                      <button
                        onClick={() => setTarget(u)}
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          u.is_suspended
                            ? 'border-emerald-200 bg-emerald-50 text-[#0f9f59] hover:bg-emerald-100'
                            : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {u.is_suspended ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Reactivate
                          </>
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Suspend
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs italic text-slate-400">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Users} text="No users found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {target && (
        <Modal title={target.is_suspended ? 'Reactivate user?' : 'Suspend user?'} onClose={() => setTarget(null)}>
          <p className="text-sm text-slate-600">
            {target.is_suspended
              ? `${target.fullName} will be able to sign in again and their published projects return to Discover.`
              : `${target.fullName} will not be able to sign in and their published projects will be hidden from Discover.`}
          </p>
          <button
            disabled={busy}
            onClick={confirm}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? 'Working...' : 'Confirm'}
          </button>
        </Modal>
      )}
    </div>
  );
}
