import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Eye,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Users,
  Search,
  Star,
  Calendar,
  AlertTriangle,
  ArchiveX,
  UserCheck,
  UserX,
  Menu,
  Inbox,
  Clock,
  ChevronRight,
  Globe,
  Info,
} from 'lucide-react';
import axios from 'axios';
import { logout } from '@/redux/slices/userSlices';
import { ActivityPanel } from './AdminConsole.jsx';

const API_BASE =
  import.meta.env?.VITE_API_BASE || 'https://nexus-backend-fbcotg.fly.dev/api';

const MAX_FEATURED_PROJECTS = 6;

const isFeaturedActive = (project) => {
  if (!project) return false;
  const isFlagged = Boolean(project.is_featured ?? project.featured);
  if (!isFlagged) return false;

  const expiryRaw = project.featured_until ?? project.feature_until ?? project.featuredUntil;
  if (!expiryRaw) return true;

  const expiryDate = new Date(expiryRaw);
  if (Number.isNaN(expiryDate.getTime())) return true;
  return expiryDate.getTime() > Date.now();
};

const formatDisplayDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// UI helper: initials for avatar circles
const getInitials = (name) => {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// UI helper: colour-coded status badge classes
const getStatusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved' || s === 'published') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  }
  if (s === 'pending_review' || s === 'pending') {
    return 'bg-amber-50 text-amber-700 border border-amber-100';
  }
  if (s === 'changes_requested') {
    return 'bg-orange-50 text-orange-700 border border-orange-100';
  }
  if (s === 'rejected') {
    return 'bg-red-50 text-red-600 border border-red-100';
  }
  if (s === 'draft') {
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

function AdminOverview() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.user || state.auth?.user || null);

const location = useLocation();
const activeNav = location.pathname.endsWith('/review') ? 'queue' : location.pathname.endsWith('/projects') ? 'projects' : location.pathname.endsWith('/users') ? 'users' : 'overview';
const setActiveNav = (id) => {
  const map = {
    overview: '/admin',
    queue: '/admin/review',
    projects: '/admin/projects',
    users: '/admin/users',
  };
  navigate(map[id] || '/admin');
};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Overview & queues state
  const [requests, setRequests] = useState([]);
  const [projectRequests, setProjectRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalApprovedProjects: 0,
    recentActivity: [],
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState('collaborations');

  // Review modal state (supports Approve, Request changes, Reject)
  const [selectedReq, setSelectedReq] = useState(null);
  const [selectedReqType, setSelectedReqType] = useState('collaboration');
  const [adminNote, setAdminNote] = useState('');
  const [noteError, setNoteError] = useState('');

  // Projects table state (S1-07 & S1-08)
  const [allProjects, setAllProjects] = useState([]);
  const [allProjectsLoading, setAllProjectsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [featureExpiryDrafts, setFeatureExpiryDrafts] = useState({});
  const [featuredBannerMsg, setFeaturedBannerMsg] = useState('');

  // Unpublish modal state
  const [unpublishTarget, setUnpublishTarget] = useState(null);
  const [unpublishReason, setUnpublishReason] = useState('');
  const [unpublishError, setUnpublishError] = useState('');

  // Users table state (S1-07)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userConfirmTarget, setUserConfirmTarget] = useState(null);
  const [userActionError, setUserActionError] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/collaborations/admin/requests`, {
        headers: getAuthHeader(),
      });
      if (response.data?.success) {
        setRequests(response.data.data || response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching admin requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/projects/admin/pending`, {
        headers: getAuthHeader(),
      });
      if (response.data?.success) {
        setProjectRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchOverviewStats = async () => {
    setOverviewLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/projects/admin/stats`, {
        headers: getAuthHeader(),
      });
      if (response.data?.success && response.data.data) {
        setOverview({
          totalUsers: response.data.data.totalUsers ?? 0,
          totalApprovedProjects: response.data.data.totalApprovedProjects ?? 0,
          recentActivity: response.data.data.recentActivity || [],
        });
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    setAllProjectsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/projects/admin/all`, {
        headers: getAuthHeader(),
      });
      const list = response.data?.data || response.data?.projects || [];
      setAllProjects(list);

      const drafts = {};
      list.forEach((p) => {
        const exp = p.featured_until ?? p.feature_until ?? p.featuredUntil;
        if (exp) {
          drafts[p.id] = String(exp).slice(0, 10);
        }
      });
      setFeatureExpiryDrafts(drafts);
    } catch (error) {
      console.error('Error fetching admin projects list:', error);
    } finally {
      setAllProjectsLoading(false);
    }
  };

  const fetchUsersList = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: getAuthHeader(),
      });
      const list = response.data?.data || response.data?.users || [];
      setUsersList(list);
    } catch (error) {
      console.error('Error fetching users list:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingProjects();
    fetchOverviewStats();
    fetchAllProjects();
    fetchUsersList();
  }, []);

  // UI: close any open modal with the Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setSelectedReq(null);
      setNoteError('');
      setUnpublishTarget(null);
      setUserConfirmTarget(null);
      setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeFeaturedCount = useMemo(
    () => allProjects.filter((p) => isFeaturedActive(p)).length,
    [allProjects]
  );

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return allProjects.filter((p) => {
      const statusVal = (p.status || '').toLowerCase();
      if (projectStatusFilter !== 'all' && statusVal !== projectStatusFilter) {
        return false;
      }
      if (!q) return true;
      const title = (p.title || '').toLowerCase();
      const owner = (p.ownerName || p.owner_name || '').toLowerCase();
      const industry = (p.industry || p.category || '').toLowerCase();
      return title.includes(q) || owner.includes(q) || industry.includes(q);
    });
  }, [allProjects, projectSearch, projectStatusFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter((u) => {
      const name = (u.name || u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [usersList, userSearch]);

  const handleAction = async (id, status) => {
    setActionLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE}/collaborations/admin/requests/${id}/status`,
        { status, action: status, adminNote },
        { headers: getAuthHeader() }
      );

      if (response.data?.success) {
        setRequests((prev) => prev.filter((item) => item.id !== id));
        setSelectedReq(null);
        setAdminNote('');
        setNoteError('');
        fetchOverviewStats();
      }
    } catch (error) {
      console.error(`Error performing ${status} action:`, error);
      alert('Failed to update request status.');
    } finally {
      setActionLoading(false);
    }
  };

  // S1-05: Approve, Request changes (note required), Reject (reason required)
  const handleProjectDecision = async (id, decision) => {
    const trimmed = adminNote.trim();
    if ((decision === 'request_changes' || decision === 'reject') && !trimmed) {
      setNoteError(
        decision === 'request_changes'
          ? 'Please enter a note explaining what changes are requested.'
          : 'Please enter a reason before rejecting this project.'
      );
      return;
    }

    setNoteError('');
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/projects/admin/action/${id}`,
        { action: decision, adminNote: trimmed },
        { headers: getAuthHeader() }
      );

      if (response.data?.success) {
        setProjectRequests((prev) => prev.filter((item) => item.id !== id));
        setSelectedReq(null);
        setAdminNote('');
        fetchOverviewStats();
        fetchAllProjects();
      }
    } catch (error) {
      console.error(`Error performing project ${decision} action:`, error);
      alert(error.response?.data?.message || 'Failed to update project status.');
    } finally {
      setActionLoading(false);
    }
  };

  // S1-07: Unpublish with required reason -> Changes requested + owner notified
  const handleConfirmUnpublish = async (e) => {
    e.preventDefault();
    if (!unpublishTarget) return;
    const reason = unpublishReason.trim();
    if (!reason) {
      setUnpublishError('Unpublish reason is required.');
      return;
    }

    setUnpublishError('');
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/projects/admin/unpublish/${unpublishTarget.id}`,
        { reason, adminNote: reason },
        { headers: getAuthHeader() }
      );

      if (response.data?.success) {
        setUnpublishTarget(null);
        setUnpublishReason('');
        fetchAllProjects();
        fetchOverviewStats();
      }
    } catch (error) {
      console.error('Error unpublishing project:', error);
      setUnpublishError(error.response?.data?.message || 'Failed to unpublish project.');
    } finally {
      setActionLoading(false);
    }
  };

  // S1-08: Featured toggle + optional expiry date + max 6 limit
  const handleToggleFeatured = async (project) => {
    const currentlyActive = isFeaturedActive(project);
    const nextFeatured = !currentlyActive;

    if (nextFeatured && activeFeaturedCount >= MAX_FEATURED_PROJECTS) {
      setFeaturedBannerMsg(
        `Maximum ${MAX_FEATURED_PROJECTS} active featured projects allowed at once. Unfeature one first.`
      );
      return;
    }

    setFeaturedBannerMsg('');
    setActionLoading(true);
    const featuredUntil = featureExpiryDrafts[project.id] || null;

    try {
      const response = await axios.patch(
        `${API_BASE}/projects/admin/featured/${project.id}`,
        {
          featured: nextFeatured,
          is_featured: nextFeatured,
          featured_until: nextFeatured ? featuredUntil : null,
        },
        { headers: getAuthHeader() }
      );

      if (response.data?.success) {
        setAllProjects((prev) =>
          prev.map((item) =>
            item.id === project.id
              ? {
                  ...item,
                  featured: nextFeatured,
                  is_featured: nextFeatured,
                  featured_until: nextFeatured ? featuredUntil : null,
                }
              : item
          )
        );
        fetchOverviewStats();
      }
    } catch (error) {
      console.error('Error toggling featured state:', error);
      setFeaturedBannerMsg(
        error.response?.data?.message || 'Could not update featured status.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpiryDateChange = async (project, newDateStr) => {
    setFeatureExpiryDrafts((prev) => ({ ...prev, [project.id]: newDateStr }));

    const isCurrentlyFeatured = Boolean(project.featured ?? project.is_featured);
    if (!isCurrentlyFeatured) return;

    try {
      await axios.patch(
        `${API_BASE}/projects/admin/featured/${project.id}`,
        {
          featured: true,
          is_featured: true,
          featured_until: newDateStr || null,
        },
        { headers: getAuthHeader() }
      );
      setAllProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? { ...item, featured_until: newDateStr || null }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating featured expiry date:', error);
    }
  };

  // S1-07: Suspend / Reactivate user (cannot suspend self or another admin)
  const isTargetProtectedAdmin = (targetUser) => {
    if (!targetUser) return false;
    const roleLower = (targetUser.role || '').toLowerCase();
    const isSelf =
      currentUser &&
      (String(currentUser.id) === String(targetUser.id) ||
        (currentUser.email &&
          targetUser.email &&
          currentUser.email.toLowerCase() === targetUser.email.toLowerCase()));
    return isSelf || roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'super admin';
  };

  const handleConfirmUserStatus = async () => {
    if (!userConfirmTarget) return;
    if (isTargetProtectedAdmin(userConfirmTarget)) {
      setUserActionError('You cannot suspend yourself or another admin.');
      return;
    }

    const willSuspend = !(userConfirmTarget.is_suspended || userConfirmTarget.status === 'suspended');
    setUserActionError('');
    setActionLoading(true);

    try {
      const response = await axios.patch(
        `${API_BASE}/admin/users/${userConfirmTarget.id}/status`,
        {
          suspended: willSuspend,
          status: willSuspend ? 'suspended' : 'active',
        },
        { headers: getAuthHeader() }
      );

      if (response.data?.success) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === userConfirmTarget.id
              ? {
                  ...u,
                  is_suspended: willSuspend,
                  status: willSuspend ? 'suspended' : 'active',
                }
              : u
          )
        );
        setUserConfirmTarget(null);
        fetchOverviewStats();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setUserActionError(error.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('nexus_token');
    navigate('/login', { replace: true });
  };

  const stats = [
    {
      value: overviewLoading ? '—' : Number(overview.totalUsers || 0).toLocaleString(),
      label: 'Registered users',
      icon: Users,
      accent: 'bg-sky-50 text-sky-600',
    },
    {
      value: overviewLoading
        ? '—'
        : Number(overview.totalApprovedProjects || 0).toLocaleString(),
      label: 'Active projects',
      icon: FolderKanban,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      value: requests.length + projectRequests.length,
      label: 'Pending requests',
      icon: Clock,
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      value: `${activeFeaturedCount}/${MAX_FEATURED_PROJECTS}`,
      label: 'Featured slots used',
      icon: Star,
      accent: 'bg-violet-50 text-violet-600',
    },
  ];

  const activeLoading = activeQueue === 'collaborations' ? loading : projectsLoading;
  const activeList = activeQueue === 'collaborations' ? requests : projectRequests;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'queue',
      label: 'Review queue',
      icon: ClipboardList,
      badge: requests.length + projectRequests.length,
    },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: allProjects.length },
    { id: 'users', label: 'Users', icon: Users, badge: usersList.length },
  ];

  const adminDisplayName =
    currentUser?.name || currentUser?.full_name || currentUser?.email || 'Admin';

  // UI: status filter chips with live counts (the <select> filter is kept as well)
  const statusChips = [
    { value: 'all', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'changes_requested', label: 'Changes' },
    { value: 'draft', label: 'Draft' },
    { value: 'rejected', label: 'Rejected' },
  ];
  const statusCount = (val) =>
    val === 'all'
      ? allProjects.length
      : allProjects.filter((p) => (p.status || '').toLowerCase() === val).length;

  const renderQueueCard = () => (
    <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Pending Requests Queue</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchPendingRequests();
            fetchPendingProjects();
            fetchOverviewStats();
          }}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          title="Refresh requests"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading || projectsLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
        <button
          type="button"
          onClick={() => setActiveQueue('collaborations')}
          className={`flex-1 text-[11px] sm:text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeQueue === 'collaborations'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Collaborations
          {requests.length > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveQueue('projects')}
          className={`flex-1 text-[11px] sm:text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeQueue === 'projects'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Projects
          {projectRequests.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {projectRequests.length}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {activeLoading ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 py-1 text-center">Loading requests...</p>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100/80 animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-300">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-400 text-center">
              {activeQueue === 'collaborations'
                ? 'No pending collaboration requests.'
                : 'No pending project submissions.'}
            </p>
          </div>
        ) : activeQueue === 'collaborations' ? (
          requests.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedReq(item);
                setSelectedReqType('collaboration');
                setAdminNote('');
                setNoteError('');
              }}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4 border border-slate-100 cursor-pointer hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                {getInitials(item.sender_name || item.senderName || `U${item.sender_id}`)}
              </div>
              <div className="min-w-0 break-words text-xs sm:text-sm text-slate-700 space-y-0.5">
                <p className="font-semibold text-slate-900">
                  {item.sender_name || item.senderName || `User #${item.sender_id}`}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Project:{' '}
                  <span className="font-medium text-slate-800">
                    {item.project_title || item.targetName || `#${item.project_id}`}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View Request
                </span>
              </div>
            </div>
          ))
        ) : (
          projectRequests.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedReq(item);
                setSelectedReqType('project');
                setAdminNote('');
                setNoteError('');
              }}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:gap-3 sm:p-4 border border-slate-100 cursor-pointer hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div className="min-w-0 break-words text-xs sm:text-sm text-slate-700 space-y-0.5">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-slate-500 text-[11px]">
                  By{' '}
                  <span className="font-medium text-slate-800">
                    {item.ownerName || item.owner_name || `User #${item.user_id}`}
                  </span>
                  {' · '}
                  {item.industry || item.category || 'General'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Review
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
 const renderActivityCard = () => <ActivityPanel />;

  const renderProjectsTab = () => (
    <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Projects management</h3>
          <p className="text-xs text-slate-500">
            Featured active: {activeFeaturedCount} / {MAX_FEATURED_PROJECTS}
          </p>
          {/* Featured slots progress bar */}
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                activeFeaturedCount >= MAX_FEATURED_PROJECTS ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (activeFeaturedCount / MAX_FEATURED_PROJECTS) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search title, owner, industry..."
              className="w-full sm:w-56 rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          <select
            value={projectStatusFilter}
            onChange={(e) => setProjectStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
          >
            <option value="all">All statuses</option>
           <option value="approved">Approved</option>
            <option value="pending_review">Pending review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Status quick filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {statusChips.map((chip) => {
          const isOn = projectStatusFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setProjectStatusFilter(chip.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                isOn
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {chip.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  isOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {statusCount(chip.value)}
              </span>
            </button>
          );
        })}
      </div>

      {featuredBannerMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 nx-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{featuredBannerMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeaturedBannerMsg('')}
            className="text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {allProjectsLoading ? (
        <div className="space-y-2.5 py-2">
          <p className="text-xs text-slate-400 text-center pb-1">Loading projects...</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100/80 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-slate-300">
            <FolderKanban className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-400 text-center">No projects match your filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-3 pr-3">Title</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Industry</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Featured &amp; Until</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 pl-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredProjects.map((proj) => {
                const featuredNow = isFeaturedActive(proj);
                const limitReachedForNew =
                  !featuredNow && activeFeaturedCount >= MAX_FEATURED_PROJECTS;
                const statusLower = (proj.status || '').toLowerCase();

                return (
                  <tr key={proj.id} className="hover:bg-emerald-50/30 align-middle transition-colors">
                    <td className="py-3 pl-3 pr-3 font-semibold text-slate-900 max-w-[190px] truncate">
                      {proj.title}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {proj.ownerName || proj.owner_name || `User #${proj.user_id}`}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {proj.industry || proj.category || '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{proj.stage || '—'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusStyle(
                          proj.status
                        )}`}
                      >
                        {proj.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading || limitReachedForNew}
                          title={
                            limitReachedForNew
                              ? `Limit of ${MAX_FEATURED_PROJECTS} featured projects reached`
                              : 'Toggle featured placement'
                          }
                          onClick={() => handleToggleFeatured(proj)}
                          className={`inline-flex items-center gap-1.5 w-fit rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            featuredNow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              featuredNow ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          {featuredNow ? 'Featured' : 'Not featured'}
                        </button>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <input
                            type="date"
                            aria-label={`Feature until for ${proj.title}`}
                            value={featureExpiryDrafts[proj.id] || ''}
                            onChange={(e) => handleExpiryDateChange(proj, e.target.value)}
                            className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                      {formatDisplayDate(proj.created_at || proj.createdAt)}
                    </td>
                    <td className="py-3 pl-3 pr-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReq(proj);
                            setSelectedReqType('project');
                            setAdminNote('');
                            setNoteError('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>

                        {statusLower === 'published' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUnpublishTarget(proj);
                              setUnpublishReason('');
                              setUnpublishError('');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <ArchiveX className="h-3.5 w-3.5" /> Unpublish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!allProjectsLoading && filteredProjects.length > 0 && (
        <p className="text-[11px] text-slate-400">
          Showing {filteredProjects.length} of {allProjects.length} projects
        </p>
      )}
    </section>
  );

  const renderUsersTab = () => (
    <section className="min-w-0 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Users management</h3>
          <p className="text-xs text-slate-500">
            Suspend or reactivate non-admin accounts. Suspended users cannot sign in.
          </p>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search name, email, role..."
            className="w-full sm:w-60 rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="space-y-2.5 py-2">
          <p className="text-xs text-slate-400 text-center pb-1">Loading users...</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100/80 animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-slate-300">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-400 text-center">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-3 pr-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Joined</th>
                <th className="py-3 px-3">Projects</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.map((u) => {
                const suspended = Boolean(u.is_suspended || u.status === 'suspended');
                const protectedAdmin = isTargetProtectedAdmin(u);

                return (
                  <tr key={u.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 pl-3 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                            suspended
                              ? 'bg-red-50 text-red-500'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {getInitials(u.name || u.full_name || `U${u.id}`)}
                        </div>
                        <span>{u.name || u.full_name || `User #${u.id}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{u.email || '—'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                      {formatDisplayDate(u.created_at || u.joined_at || u.createdAt)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {u.project_count ?? u.projectsCount ?? 0}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          suspended
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            suspended ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                        {suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-3 text-right whitespace-nowrap">
                      {protectedAdmin ? (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUserConfirmTarget(u);
                            setUserActionError('');
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border cursor-pointer ${
                            suspended
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {suspended ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" /> Reactivate
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5" /> Suspend
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!usersLoading && filteredUsers.length > 0 && (
        <p className="text-[11px] text-slate-400">
          Showing {filteredUsers.length} of {usersList.length} users
        </p>
      )}
    </section>
  );

  const historyList = Array.isArray(selectedReq?.history)
    ? selectedReq.history
    : Array.isArray(selectedReq?.review_history)
    ? selectedReq.review_history
    : [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#f6faf8] to-[#fbfcfd] font-sans overflow-x-hidden flex flex-col lg:flex-row">
      {/* UI animations */}
      <style>{`
        @keyframes nxFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nxPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .nx-fade-in { animation: nxFadeIn 0.35s ease-out both; }
        .nx-pop { animation: nxPop 0.2s ease-out both; }
      `}</style>

      {/* Left Navigation (Desktop) */}
    <aside className="hidden">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
                Project Nexus
              </h2>
              <p className="truncate text-[11px] text-slate-400">Admin console</p>
            </div>
          </div>

          <nav aria-label="Admin navigation" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-red-500 shadow-sm transition-all hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                aria-label="Toggle admin menu"
                className="lg:hidden grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer"
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Project Nexus
                </h2>
                <p className="truncate text-[11px] sm:text-xs text-slate-400">
                  Innovation ecosystem
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              {/* Signed-in admin chip */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-1.5 shadow-sm">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {getInitials(adminDisplayName)}
                </div>
                <div className="min-w-0 max-w-[140px]">
                  <p className="truncate text-xs font-semibold text-slate-800 leading-tight">
                    {adminDisplayName}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">Super admin</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-500 shadow-sm transition-all hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </header>

          {/* Mobile Navigation Bar */}
          {mobileNavOpen && (
            <nav
              aria-label="Mobile admin navigation"
              className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm nx-fade-in"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="space-y-1.5 pt-1 sm:pt-2">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 stroke-[2.2]" />
              <span className="truncate">Super admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 break-words">
              {activeNav === 'overview' && 'Platform overview'}
              {activeNav === 'queue' && 'Review queue'}
              {activeNav === 'projects' && 'Projects'}
              {activeNav === 'users' && 'Users'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {activeNav === 'overview' &&
                `Welcome back, ${adminDisplayName}. Here's what's happening on the platform.`}
              {activeNav === 'queue' && 'Review collaboration requests and project submissions.'}
              {activeNav === 'projects' && 'Manage, feature and unpublish projects.'}
              {activeNav === 'users' && 'Manage platform accounts and access.'}
            </p>
          </div>

          {activeNav === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {stats.map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className="nx-fade-in min-w-0 space-y-1 sm:space-y-2 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      {StatIcon && (
                        <div
                          className={`mb-1 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl ${stat.accent}`}
                        >
                          <StatIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="truncate text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                        {stat.value}
                      </div>
                      <div className="text-[11px] sm:text-sm leading-snug text-slate-400">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'queue', label: 'Open review queue', icon: ClipboardList },
                  { id: 'projects', label: 'Manage projects', icon: FolderKanban },
                  { id: 'users', label: 'Manage users', icon: Users },
                ].map((qa) => {
                  const QaIcon = qa.icon;
                  return (
                    <button
                      key={qa.id}
                      type="button"
                      onClick={() => setActiveNav(qa.id)}
                      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <QaIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        {qa.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {renderQueueCard()}
                {renderActivityCard()}
              </div>
            </>
          )}

          {activeNav === 'queue' && renderQueueCard()}
          {activeNav === 'projects' && renderProjectsTab()}
          {activeNav === 'users' && renderUsersTab()}
        </div>
      </div>

      {/* Review Modal (Project with 3 actions + Collaboration) */}
      {selectedReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm nx-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedReq(null);
              setNoteError('');
            }
          }}
        >
          <div className="nx-pop w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedReqType === 'project'
                    ? 'Project Submission Details'
                    : 'Collaboration Request Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReqType === 'project' ? (
                    <>
                      Submitted by:{' '}
                      <span className="font-semibold text-slate-700">
                        {selectedReq.ownerName ||
                          selectedReq.owner_name ||
                          `User #${selectedReq.user_id}`}
                      </span>
                      {selectedReq.ownerEmail && ` (${selectedReq.ownerEmail})`}
                    </>
                  ) : (
                    <>
                      Applicant:{' '}
                      <span className="font-semibold text-slate-700">
                        {selectedReq.sender_name || selectedReq.senderName}
                      </span>
                      {(selectedReq.sender_email || selectedReq.senderEmail) &&
                        ` (${selectedReq.sender_email || selectedReq.senderEmail})`}
                    </>
                  )}
                </p>
                {selectedReqType === 'project' && selectedReq.status && (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusStyle(
                      selectedReq.status
                    )}`}
                  >
                    {selectedReq.status}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setNoteError('');
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {selectedReqType === 'project' ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Project Title
                    </label>
                    <div className="mt-1 rounded-xl bg-slate-50 p-3 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-100">
                      {selectedReq.title}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Description
                    </label>
                    <div className="mt-1 min-h-[60px] rounded-xl bg-slate-50 p-3 text-xs sm:text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                      {selectedReq.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Industry
                      </label>
                      <div className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        {selectedReq.industry || selectedReq.category || 'General'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Stage
                      </label>
                      <div className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        {selectedReq.stage || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Country
                      </label>
                      <div className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        {selectedReq.country || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Extended fields preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedReq.problem_statement && (
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 sm:col-span-2">
                        <span className="font-bold text-slate-500 block mb-0.5">
                          Problem Statement
                        </span>
                        <span className="text-slate-700 whitespace-pre-wrap">
                          {selectedReq.problem_statement}
                        </span>
                      </div>
                    )}
                    {selectedReq.funding_requirement && (
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-500 block mb-0.5">
                          Funding Requirement
                        </span>
                        <span className="text-slate-700">
                          {selectedReq.funding_requirement}
                        </span>
                      </div>
                    )}
                    {selectedReq.team_size != null && (
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-500 block mb-0.5">Team Size</span>
                        <span className="text-slate-700">{selectedReq.team_size}</span>
                      </div>
                    )}
                    {selectedReq.website_url && (
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website
                        </span>
                        <span className="text-emerald-700 break-all">
                          {selectedReq.website_url}
                        </span>
                      </div>
                    )}
                    {selectedReq.deck_url && (
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <span className="font-bold text-slate-500 block mb-0.5">
                          Pitch Deck / Video
                        </span>
                        <span className="text-emerald-700 break-all">{selectedReq.deck_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Decision history */}
                  {historyList.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Decision History
                      </label>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {historyList.map((h, i) => (
                          <div
                            key={h.id || i}
                            className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700 border border-slate-100"
                          >
                            <div className="font-semibold text-slate-900">
                              {h.action || h.decision} · by {h.actor_name || h.by || 'Admin'}
                              {(h.created_at || h.at) && (
                                <span className="font-normal text-slate-400 ml-1">
                                  ({formatDateTime(h.created_at || h.at)})
                                </span>
                              )}
                            </div>
                            {(h.note || h.reason) && (
                              <p className="text-slate-600 mt-0.5">{h.note || h.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Target Project
                    </label>
                    <div className="mt-1 rounded-xl bg-slate-50 p-3 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-100">
                      {selectedReq.project_title ||
                        selectedReq.targetName ||
                        `Project ID: #${selectedReq.project_id}`}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      User Message / Proposal
                    </label>
                    <div className="mt-1 min-h-[70px] rounded-xl bg-slate-50 p-3 text-xs sm:text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                      {selectedReq.message ||
                        'No specific message attached with this request.'}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedReqType === 'project'
                    ? 'Admin note / reason (Required for Request changes & Reject)'
                    : 'Response / Note to User (Optional)'}
                </label>
                <textarea
                  rows="2"
                  placeholder="Provide feedback, required changes, or rejection reason..."
                  value={adminNote}
                  onChange={(e) => {
                    setAdminNote(e.target.value);
                    if (noteError) setNoteError('');
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
                />
                <div className="mt-1 flex items-center justify-between">
                  {noteError ? (
                    <p className="text-xs font-medium text-red-600">{noteError}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-slate-400">{adminNote.length} chars</span>
                </div>
              </div>
            </div>

            {selectedReqType === 'project' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleProjectDecision(selectedReq.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleProjectDecision(selectedReq.id, 'request_changes')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                >
                  Request changes
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleProjectDecision(selectedReq.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedReq.id, 'accepted')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Accept Request
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedReq.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                >
                  <X className="h-4 w-4" /> Reject Request
                </button>
              </div>
            )}

            <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Info className="h-3 w-3" /> Press Esc to close
            </p>
          </div>
        </div>
      )}

      {/* Unpublish Reason Modal (S1-07) */}
      {unpublishTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm nx-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUnpublishTarget(null);
          }}
        >
          <form
            onSubmit={handleConfirmUnpublish}
            className="nx-pop w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
                  <ArchiveX className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Unpublish project</h3>
                  <p className="text-xs text-slate-500">
                    &ldquo;{unpublishTarget.title}&rdquo; will move to Changes requested and notify
                    the owner.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnpublishTarget(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reason (Required)
              </label>
              <textarea
                rows="3"
                value={unpublishReason}
                onChange={(e) => {
                  setUnpublishReason(e.target.value);
                  if (unpublishError) setUnpublishError('');
                }}
                placeholder="Explain why this project is being unpublished..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {unpublishError && (
                <p className="mt-1 text-xs font-medium text-red-600">{unpublishError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnpublishTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
              >
                Confirm Unpublish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Suspend / Reactivate Confirmation Modal (S1-07) */}
      {userConfirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm nx-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserConfirmTarget(null);
          }}
        >
          <div className="nx-pop w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  userConfirmTarget.is_suspended || userConfirmTarget.status === 'suspended'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-500'
                }`}
              >
                {userConfirmTarget.is_suspended || userConfirmTarget.status === 'suspended' ? (
                  <UserCheck className="h-5 w-5" />
                ) : (
                  <UserX className="h-5 w-5" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {userConfirmTarget.is_suspended || userConfirmTarget.status === 'suspended'
                  ? 'Reactivate user account?'
                  : 'Suspend user account?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              User:{' '}
              <span className="font-semibold text-slate-900">
                {userConfirmTarget.name || userConfirmTarget.full_name}
              </span>{' '}
              ({userConfirmTarget.email})
            </p>
            {userActionError && (
              <p className="text-xs font-medium text-red-600">{userActionError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserConfirmTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmUserStatus}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOverview;
