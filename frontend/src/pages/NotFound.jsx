import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div>
          <span className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Error 404
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            Page not found
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
