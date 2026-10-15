import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, ArrowRight, Bookmark, Ticket, AlertTriangle, X } from 'lucide-react';
import Skeleton from '../components/Skeleton';

export default function MyRegistrations() {
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  const [cancellingRegistration, setCancellingRegistration] = useState(null); // holds event to cancel
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const res = await registrationApi.getMyRegistrations();
      setRegistrations(res.data?.registrations || []);
    } catch (err) {
      toast.error('Failed to load your event registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingRegistration) return;
    setSubmittingCancel(true);

    try {
      await registrationApi.cancel(cancellingRegistration.event_id);
      toast.success('Registration cancelled successfully. Your seat has been freed.');
      setCancellingRegistration(null);
      await fetchRegistrations();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const now = new Date();

  // Filter registrations by tab
  const filteredRegistrations = registrations.filter((reg) => {
    const isCancelled = reg.registration_status === 'CANCELLED';
    const isPast = new Date(reg.end_at || reg.start_at) < now;

    if (activeTab === 'cancelled') {
      return isCancelled;
    }
    if (activeTab === 'past') {
      return !isCancelled && isPast;
    }
    // upcoming: active and not yet past
    return !isCancelled && !isPast;
  });

  const getTabCount = (tab) => {
    return registrations.filter((reg) => {
      const isCancelled = reg.registration_status === 'CANCELLED';
      const isPast = new Date(reg.end_at || reg.start_at) < now;

      if (tab === 'cancelled') return isCancelled;
      if (tab === 'past') return !isCancelled && isPast;
      return !isCancelled && !isPast;
    }).length;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 mb-3 shadow-sm">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          My Event Registrations
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">
          Manage your booked spots, review event dates, and monitor your active reservations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 pb-3">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past Events' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" count={3} />
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl text-center py-16 px-6 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            No {activeTab} registrations
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {activeTab === 'upcoming'
              ? "You don't have any upcoming events scheduled. Explore campus workshops!"
              : activeTab === 'cancelled'
              ? 'No cancelled registrations recorded.'
              : 'You have not attended any previous events yet.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all"
            >
              Explore Open Events <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const isActive = reg.registration_status === 'ACTIVE';
            return (
              <div
                key={reg.registration_id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md">
                      {reg.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {reg.registration_status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {reg.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(reg.start_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reg.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {isActive && activeTab === 'upcoming' && (
                    <button
                      onClick={() => setCancellingRegistration(reg)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      Cancel Seat
                    </button>
                  )}

                  <Link
                    to={`/events/${reg.event_id}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>View Event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
                <AlertTriangle className="w-5 h-5" />
                <span>Cancel Reservation</span>
              </div>
              <button
                onClick={() => setCancellingRegistration(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to cancel your seat for{' '}
              <strong className="text-slate-900 dark:text-white">
                "{cancellingRegistration.title}"
              </strong>
              ? This seat will immediately become available for other students to claim.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingRegistration(null)}
                disabled={submittingCancel}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {submittingCancel ? 'Releasing Seat...' : 'Yes, Cancel Seat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
