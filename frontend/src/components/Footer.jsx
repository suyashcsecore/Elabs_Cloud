import React from 'react';
import { Calendar } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>&copy; {new Date().getFullYear()} eLabs Cloud Computing Domain Project.</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <span>Built with React, Express, PostgreSQL & Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}
