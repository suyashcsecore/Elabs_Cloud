import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi, registrationApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Users, Clock, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, LogIn, Hourglass } from 'lucide-react';
import Skeleton from '../components/Skeleton';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  const fetchEvent = async () => {
    try {
      const res = await eventApi.getById(eventId);
      setEvent(res.data?.event || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Live countdown timer to registration deadline
  useEffect(() => {
    if (!event?.registration_deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(event.registration_deadline).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsPastDeadline(true);
        setTimeLeft('Registration Closed');
        return;
      }

      setIsPastDeadline(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m left to register`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left to register`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.registration_deadline]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in or create an account to register.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await registrationApi.register(eventId);
      toast.success('Successfully reserved your seat!');
      await fetchEvent();
    } catch (err) {
      if (err.code === 'EVENT_FULL' || err.status === 409) {
        toast.error('This event just reached maximum capacity. No seats available.');
      } else {
        toast.error(err.message || 'Registration failed.');
      }
      await fetchEvent(); // refresh live seat count
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your seat reservation?')) return;

    setSubmitting(true);
    try {
      await registrationApi.cancel(eventId);
      toast.success('Your seat has been released.');
      await fetchEvent();
    } catch (err) {
      toast.error(err.message || 'Cancellation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-3/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Event Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The requested event could not be found or has been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  const isFull = event.remaining_seats <= 0;
  const isRegistered = event.is_user_registered;

  const renderActionButton = () => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <LogIn className="w-5 h-5" />
          <span>Login to Register</span>
        </button>
      );
    }

    if (isRegistered) {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>You are registered for this event! Your seat is confirmed.</span>
          </div>
          <button
            onClick={handleCancelRegistration}
            disabled={submitting || isPastDeadline}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Cancelling...' : 'Cancel Registration'}
          </button>
        </div>
      );
    }

    if (isPastDeadline) {
      return (
        <button
          disabled
          className="w-full py-3.5 rounded-xl font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-center"
        >
          Deadline Passed (Registration Closed)
        </button>
      );
    }

    if (isFull) {
      return (
        <button
          disabled
          className="w-full py-3.5 rounded-xl font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 cursor-not-allowed text-center"
        >
          Event Full (0 Seats Left)
        </button>
      );
    }

    return (
      <button
        onClick={handleRegister}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 disabled:opacity-50"
      >
        {submitting ? 'Reserving Seat...' : 'Register Now'}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all events
      </Link>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
            {event.category || 'General'}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Status: {event.status}
          </span>
        </div>

        {/* Title & Organizer */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
          {event.title}
        </h1>

        <div className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Organized by <span className="font-semibold text-slate-800 dark:text-slate-200">{event.organizer_name}</span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Start Time
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {new Date(event.start_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> End Time
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {new Date(event.end_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {event.location}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Available Seats
            </div>
            <div className="text-sm font-bold">
              <span className={isFull ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {event.remaining_seats}
              </span>{' '}
              <span className="text-slate-400 font-normal">/ {event.capacity}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About this Event</h2>
          <div className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {event.description}
          </div>
        </div>

        {/* Live Countdown Banner */}
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 border transition-all ${
            isPastDeadline
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              : 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
          }`}
        >
          <Hourglass className={`w-5 h-5 flex-shrink-0 ${isPastDeadline ? '' : 'animate-spin'}`} />
          <div className="text-sm">
            <span className="font-semibold">{timeLeft}</span>
            <span className="text-xs opacity-75 block mt-0.5">
              Deadline: {new Date(event.registration_deadline).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Button Section with all 5 states */}
        <div>{renderActionButton()}</div>
      </div>
    </div>
  );
}
