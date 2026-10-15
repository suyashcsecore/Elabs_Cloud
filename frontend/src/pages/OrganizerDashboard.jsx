import React, { useState, useEffect, useMemo } from 'react';
import { eventApi, organizerApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Download,
  Users,
  Calendar,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Edit3,
  Ban,
  Search,
  ArrowUpDown,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import Skeleton from '../components/Skeleton';

export default function OrganizerDashboard() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantStats, setParticipantStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Search & sorting for participant roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [sortField, setSortField] = useState('student_name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [cancellingEvent, setCancellingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    startAt: '',
    endAt: '',
    location: '',
    capacity: 50,
    registrationDeadline: '',
  });

  const fetchOrganizerEvents = async () => {
    setLoading(true);
    try {
      const res = await organizerApi.getEvents();
      const evList = res.data?.events || [];
      setEvents(evList);
      if (evList.length > 0 && !selectedEventId) {
        setSelectedEventId(evList[0].id);
      }
    } catch (err) {
      toast.error('Failed to load organizer events.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (id) => {
    if (!id) return;
    setLoadingRoster(true);
    try {
      const res = await organizerApi.getParticipants(id);
      setParticipants(res.data?.participants || []);
      setParticipantStats(res.data?.event || null);
    } catch (err) {
      toast.error('Failed to load participants list.');
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants(selectedEventId);
    }
  }, [selectedEventId]);

  // Small stat cards calculation
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.start_at) > now && e.status !== 'CANCELLED').length;

  const handleOpenCreateModal = () => {
    setForm({
      title: '',
      description: '',
      category: 'Workshop',
      startAt: '',
      endAt: '',
      location: '',
      capacity: 50,
      registrationDeadline: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (ev) => {
    setEditingEvent(ev);
    const toLocalISO = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setForm({
      title: ev.title || '',
      description: ev.description || '',
      category: ev.category || 'Workshop',
      startAt: toLocalISO(ev.start_at),
      endAt: toLocalISO(ev.end_at),
      location: ev.location || '',
      capacity: ev.capacity || 50,
      registrationDeadline: toLocalISO(ev.registration_deadline),
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await eventApi.create({
        ...form,
        capacity: parseInt(form.capacity, 10),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      });
      toast.success('Event draft created successfully!');
      setShowCreateModal(false);
      await fetchOrganizerEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);

    try {
      await eventApi.update(editingEvent.id, {
        ...form,
        capacity: parseInt(form.capacity, 10),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      });
      toast.success('Event updated successfully!');
      setEditingEvent(null);
      await fetchOrganizerEvents();
      if (selectedEventId === editingEvent.id) {
        await fetchParticipants(selectedEventId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await eventApi.publish(id);
      toast.success('Event published! It is now live for students.');
      await fetchOrganizerEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to publish event.');
    }
  };

  const handleCancelEvent = async () => {
    if (!cancellingEvent) return;
    setSubmitting(true);
    try {
      await eventApi.cancel(cancellingEvent.id);
      toast.success(`Event "${cancellingEvent.title}" has been cancelled.`);
      setCancellingEvent(null);
      await fetchOrganizerEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async (id) => {
    try {
      const blob = await organizerApi.exportCSV(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants_event_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Attendee CSV roster downloaded.');
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  // Filter & sort roster
  const filteredParticipants = useMemo(() => {
    let list = participants.filter((p) => {
      const q = rosterSearch.toLowerCase();
      return (
        p.student_name?.toLowerCase().includes(q) ||
        p.student_email?.toLowerCase().includes(q) ||
        p.registration_status?.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [participants, rosterSearch, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Organizer Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manage Events & Rosters
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create events, publish drafts, track seat occupancy in real-time, and download rosters.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Small Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalEvents}</div>
          <div className="text-xs text-slate-400 mt-1">Under your account management</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Registrations</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalRegistrations}</div>
          <div className="text-xs text-slate-400 mt-1">Active student reservations</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Events</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{upcomingEvents}</div>
          <div className="text-xs text-slate-400 mt-1">Scheduled future sessions</div>
        </div>
      </div>

      {/* Main Grid: Events List & Participant Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Managed Events List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center justify-between">
            <span>Your Managed Events</span>
            <span className="text-xs font-normal text-slate-400">{events.length} total</span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" count={3} />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              No events found. Click "New Event" above to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-md">
                        {ev.category}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          ev.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : ev.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 line-clamp-1">
                      {ev.title}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span>
                        Seats: <strong>{ev.registered_count || 0}</strong> / {ev.capacity} ({ev.remaining_seats} left)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ev.status !== 'CANCELLED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(ev);
                            }}
                            className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {ev.status === 'DRAFT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublish(ev.id);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Publish
                          </button>
                        )}

                        {ev.status !== 'CANCELLED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancellingEvent(ev);
                            }}
                            className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Cancel Event"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportCSV(ev.id);
                          }}
                          className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                          title="Download CSV Roster"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Participant Roster Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Attendee Roster{' '}
              {participantStats && (
                <span className="text-xs font-medium text-slate-400">
                  ({participantStats.activeRegistrations} active / {participantStats.capacity} cap)
                </span>
              )}
            </h2>

            {selectedEventId && (
              <button
                onClick={() => handleExportCSV(selectedEventId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            )}
          </div>

          {/* Search roster input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search participants by name, email, or status..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loadingRoster ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-10 w-full" count={4} />
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No students found matching your roster search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th
                        onClick={() => toggleSort('student_name')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Student</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => toggleSort('student_email')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Email</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => toggleSort('registration_status')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => toggleSort('registered_at')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredParticipants.map((p) => (
                      <tr key={p.registration_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {p.student_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {p.student_email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.registration_status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                          >
                            {p.registration_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {new Date(p.registered_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create or Edit Event */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Event Title
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Hands-on Docker & Kubernetes Workshop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Webinar">Webinar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed schedule, prerequisites, and learning objectives..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Venue / Platform
                  </label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Auditorium / Zoom"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min={editingEvent ? editingEvent.registered_count || 1 : 1}
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  {editingEvent && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Minimum {editingEvent.registered_count || 0} (active seats already booked)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.registrationDeadline}
                  onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Cancel Event */}
      {cancellingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <Ban className="w-5 h-5" />
                <span>Cancel Event</span>
              </div>
              <button onClick={() => setCancellingEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to cancel <strong>"{cancellingEvent.title}"</strong>? It will be marked as CANCELLED and registration will be permanently closed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingEvent(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleCancelEvent}
                disabled={submitting}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? 'Cancelling...' : 'Yes, Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
