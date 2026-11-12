import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, Search, Sparkles, X } from 'lucide-react';
import { formatTodayHeader, toDateInputString } from '../utils/taskDates';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tasks': 'Tasks & Assignments',
  '/timetable': 'Timetable',
  '/notes': 'Notes',
  '/focus': 'Focus',
};

export function TopBar({
  searchQuery,
  onSearchChange,
  onOpenNewTask,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timerId = null;
    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
      timerId = window.setTimeout(() => {
        setToday(new Date());
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const current = new Date();
      setToday((prev) =>
        toDateInputString(prev) === toDateInputString(current) ? prev : current
      );
    };

    scheduleNextMidnight();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const title = PAGE_TITLES[pathname] || 'Dashboard';
  const todayText = formatTodayHeader(today);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    onSearchChange(val);
    if (val.trim() && pathname !== '/tasks') {
      navigate('/tasks');
    }
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FAF9F6]/90 border-b border-[#121316]/[0.1] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Page Title + Mobile Brand Mark */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="md:hidden w-8 h-8 rounded-xl bg-[#121316] flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#5B8DEF]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#121316] truncate">
              {title}
            </h1>
            <p className="sm:hidden text-[11px] text-[#424652] truncate">
              {todayText}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, Date, + New Task */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 sm:flex-initial justify-end">
          {/* Search Input */}
          <div className="relative flex-1 max-w-[200px] sm:max-w-[240px] md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E7382]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-xl bg-white border border-[#121316]/[0.12] pl-8 pr-7 py-2 text-xs sm:text-sm text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[#6E7382] hover:text-[#121316] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Today's Date Pill */}
          <div className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#121316]/[0.11] text-xs font-medium text-[#424652] whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#5B8DEF]" />
            <span>{todayText}</span>
          </div>

          {/* Quick + New Task CTA */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#121316] hover:bg-[#23252C] text-[#FAF9F6] text-xs sm:text-sm font-semibold px-3.5 py-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#5B8DEF]" />
            <span>New Task</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
