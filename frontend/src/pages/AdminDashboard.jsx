import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  Users,
  Calendar,
  CheckSquare,
  Search,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export default function AdminDashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Confirmation modal state
  const [pendingAction, setPendingAction] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await adminApi.getSummary();
      setSummary(res.data || null);
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers({ search: userSearch || undefined, limit: 50 });
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await adminApi.getEvents();
      setAllEvents(res.data?.events || []);
    } catch (err) {
      console.error('Failed to load all events:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchUsers(), fetchAllEvents()]);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setSubmittingAction(true);

    try {
      if (pendingAction.type === 'role') {
        await adminApi.updateRole(pendingAction.userId, pendingAction.newRole);
        toast.success(`User role changed to ${pendingAction.newRole}.`);
      } else if (pendingAction.type === 'status') {
        await adminApi.updateStatus(pendingAction.userId, pendingAction.newStatus);
        toast.success(`User status changed to ${pendingAction.newStatus}.`);
      }
      setPendingAction(null);
      await Promise.all([fetchSummary(), fetchUsers()]);
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Prepare chart data
  const registrationsLineData = summary?.registrationsLast14Days || [];

  const eventsDonutData = summary?.eventsByStatus
    ? [
        { name: 'Published', value: summary.eventsByStatus.published || 0 },
        { name: 'Draft', value: summary.eventsByStatus.draft || 0 },
        { name: 'Cancelled', value: summary.eventsByStatus.cancelled || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const topEventsBarData = (summary?.topEvents || []).map((e) => ({
    name: e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title,
    seats: e.active_registrations,
    capacity: e.capacity,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>System Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Admin Control Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor registration velocity, manage student and organizer privileges, and review system stats.
        </p>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Users</span>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary.usersByRole?.total || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {summary.usersByRole?.student || 0} Students • {summary.usersByRole?.organizer || 0} Organizers
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary.eventsByStatus?.total || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {summary.eventsByStatus?.published || 0} Published ({summary.eventsByStatus?.totalCapacity || 0} seats capacity)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Active Bookings</span>
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary.totalActiveRegistrations || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Confirmed reservations ({summary.totalRegistrations - summary.totalActiveRegistrations} cancelled)
              </div>
            </div>
          </div>
        )
      )}

      {/* Analytics Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Registrations Per Day (Line Chart, 7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Registrations Velocity (Last 14 Days)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationsLineData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activeCount"
                  name="Active Bookings"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events By Status (Donut Chart, 5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Events Distribution
            </h3>
            <span className="text-xs text-slate-400">By workflow status</span>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {eventsDonutData.length === 0 ? (
              <span className="text-xs text-slate-400">No events data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventsDonutData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventsDonutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Events By Registrations (Bar Chart, full 12 cols) */}
        {topEventsBarData.length > 0 && (
          <div className="lg:col-span-12 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Top Events by Active Registrations
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEventsBarData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="seats" name="Booked Seats" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* User Governance Table with Role Dropdown & Enable/Disable Toggle */}
      <div className="space-y-4 mb-14">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              User Role & Access Governance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign Organizer privileges, demote to Student, or disable platform access
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isUserActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ADMIN
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              setPendingAction({
                                type: 'role',
                                userId: u.id,
                                userName: u.name,
                                newRole: e.target.value,
                              })
                            }
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isUserActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isAdmin && (
                          <button
                            onClick={() =>
                              setPendingAction({
                                type: 'status',
                                userId: u.id,
                                userName: u.name,
                                newStatus: isUserActive ? 'DISABLED' : 'ACTIVE',
                              })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              isUserActive
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
                                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                            }`}
                          >
                            {isUserActive ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All-Events Overview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            All-Events Platform Overview
          </h2>
          <span className="text-xs text-slate-400">{allEvents.length} events recorded</span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Organizer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bookings / Cap</th>
                  <th className="py-3 px-4">Start Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {ev.title}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {ev.organizer_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ev.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : ev.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <strong>{ev.registered_count || 0}</strong> / {ev.capacity}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(ev.start_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Role and Status Changes */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Governance Action</span>
              </div>
              <button onClick={() => setPendingAction(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {pendingAction.type === 'role' ? (
                <>
                  Are you sure you want to change the role for{' '}
                  <strong>"{pendingAction.userName}"</strong> to{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {pendingAction.newRole}
                  </span>
                  ?
                </>
              ) : (
                <>
                  Are you sure you want to set status for{' '}
                  <strong>"{pendingAction.userName}"</strong> to{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {pendingAction.newStatus}
                  </span>
                  ? Disabled accounts cannot log in to the portal.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submittingAction}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {submittingAction ? 'Updating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
