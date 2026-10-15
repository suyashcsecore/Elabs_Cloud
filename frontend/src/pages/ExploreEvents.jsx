import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../api/client';
import { Search, Calendar, MapPin, Users, Sparkles, Clock, ArrowRight, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Skeleton, { EventCardSkeleton } from '../components/Skeleton';

const CATEGORIES = ['All', 'Workshop', 'Hackathon', 'Seminar', 'Webinar'];

export default function ExploreEvents() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.list({
        search: search.trim() || undefined,
        category: category || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        page,
        limit,
      });
      setEvents(res.data?.events || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, startDate, endDate, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getStatusBadge = (status, availability) => {
    if (status === 'CANCELLED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Cancelled
        </span>
      );
    }
    if (availability === 'FULL') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          FULL
        </span>
      );
    }
    if (availability === 'CLOSED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Closed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Open
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KIIT eLabs Cloud Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4">
          Discover & Register for <br />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-400 bg-clip-text text-transparent">
            Technical Workshops & Hackathons
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          Explore published campus events with real-time capacity monitoring, guaranteed seat reservation, and instant registration tracking.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by title or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>From:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <span className="text-xs text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = (cat === 'All' && !category) || category === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat === 'All' ? '' : cat);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl text-center py-16 px-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No events found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            We couldn't find any events matching your filter criteria. Try adjusting dates or keywords.
          </p>
          {(search || category || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const capacity = event.capacity || 1;
              const remaining = event.remaining_seats ?? 0;
              const booked = capacity - remaining;
              const percentageRemaining = Math.max(0, Math.min(100, Math.round((remaining / capacity) * 100)));
              const isFull = remaining <= 0;
              const isLowSeats = percentageRemaining <= 20 && !isFull;

              return (
                <div
                  key={event.id}
                  className="group bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md">
                        {event.category || 'General'}
                      </span>
                      {getStatusBadge(event.status, event.availability_status)}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-6">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(event.start_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{event.location || 'Online'}</span>
                      </div>
                    </div>

                    {/* Seat Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Seats remaining:</span>
                        <span
                          className={`font-bold ${
                            isFull
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLowSeats
                              ? 'text-rose-500 dark:text-rose-400 animate-pulse'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {isFull ? 'FULL (0 seats)' : `${remaining} seat${remaining === 1 ? '' : 's'} left`}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isFull
                              ? 'bg-rose-500 w-full'
                              : isLowSeats
                              ? 'bg-rose-500'
                              : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                          }`}
                          style={{ width: isFull ? '100%' : `${Math.max(8, (booked / capacity) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
