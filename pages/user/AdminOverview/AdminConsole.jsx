import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/api/axios';

const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '-');

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
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
    ['/admin', 'Overview', true],
    ['/admin/review', 'Review queue', false],
    ['/admin/projects', 'Projects', false],
    ['/admin/users', 'Users', false],
  ];
  return (
    <div className="flex min-h-screen bg-slate-50">
      <nav className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-slate-900">Admin</h2>
        {links.map(([to, label, end]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mb-1 block rounded-lg px-3 py-2 text-sm font-semibold ${
                isActive ? 'bg-emerald-50 text-[#0f9f59]' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-bold text-slate-900">Recent admin activity</h3>
      {!items.length && <p className="text-xs text-slate-400">No activity yet.</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} className="border-b border-slate-100 py-2 text-sm last:border-0">
            <span className="font-semibold">{a.adminName || 'Admin'}</span>: {a.summary}
            <div className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
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
  const dq = useDebounced(q);

  const load = useCallback(() => {
    api
      .get('/admin/console/projects', { params: { q: dq, status } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => toast.error(errMsg(e)));
  }, [dq, status]);
  useEffect(load, [load]);

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
      <h1 className="mb-4 text-xl font-extrabold text-slate-900">Projects</h1>
      <div className="mb-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or owner"
          className="w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {['all', 'pending', 'approved', 'rejected', 'changes_requested'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Title', 'Owner', 'Industry', 'Stage', 'Status', 'Featured', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{p.title}</td>
                <td className="px-3 py-2">{p.ownerName}</td>
                <td className="px-3 py-2">{p.industry || '-'}</td>
                <td className="px-3 py-2">{p.stage || '-'}</td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">{p.is_featured ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{fmt(p.created_at)}</td>
                <td className="flex gap-3 px-3 py-2">
                  <Link to={`/projects/${p.id}`} className="font-semibold text-[#0f9f59] hover:underline">
                    View
                  </Link>
                  {p.status === 'approved' && (
                    <button
                      onClick={() => { setTarget(p); setReason(''); }}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      Unpublish
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400">No projects found.</td></tr>
            )}
          </tbody>
        </table>
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
            className="w-full rounded-xl border border-slate-200 p-2 text-sm"
          />
          <button
            disabled={reason.trim().length < 3 || busy}
            onClick={unpublish}
            className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
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
  const dq = useDebounced(q);

  const load = useCallback(() => {
    api
      .get('/admin/users', { params: { q: dq } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => toast.error(errMsg(e)));
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
      <h1 className="mb-4 text-xl font-extrabold text-slate-900">Users</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email"
        className="mb-3 w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Name', 'Email', 'Role', 'Joined', 'Projects', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{u.fullName}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{fmt(u.created_at)}</td>
                <td className="px-3 py-2">{u.project_count}</td>
                <td className="px-3 py-2">{u.is_suspended ? 'Suspended' : 'Active'}</td>
                <td className="px-3 py-2">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => setTarget(u)}
                      className={`font-semibold hover:underline ${u.is_suspended ? 'text-[#0f9f59]' : 'text-red-600'}`}
                    >
                      {u.is_suspended ? 'Reactivate' : 'Suspend'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
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
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Working...' : 'Confirm'}
          </button>
        </Modal>
      )}
    </div>
  );
}