import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, Search, Sparkles, X } from 'lucide-react';
import { formatTodayHeader } from '../utils/taskDates';

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
  const title = PAGE_TITLES[pathname] || 'Dashboard';
  const todayText = formatTodayHeader(new Date());

  const handleSearchInput = (e) => {
    const val = e.target.value;
    onSearchChange(val);
    if (val.trim() && pathname !== '/tasks') {
      navigate('/tasks');
    }
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur-2xl bg-[#F1F2F9]/80 border-b border-[#24252A]/[0.07] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Page Title + Mobile Brand Mark */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="md:hidden w-8 h-8 rounded-xl bg-[#4E51BF] flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#24252A] truncate">
              {title}
            </h1>
            <p className="sm:hidden text-[11px] text-[#5C6070] truncate">
              {todayText}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, Date, + New Task */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 sm:flex-initial justify-end">
          {/* Search Input */}
          <div className="relative flex-1 max-w-[200px] sm:max-w-[240px] md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8F9E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-xl bg-white/90 border border-[#24252A]/[0.09] pl-8 pr-7 py-2 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[#8A8F9E] hover:text-[#24252A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Today's Date Pill */}
          <div className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-[#24252A]/[0.08] text-xs font-medium text-[#5C6070] whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#4E51BF]" />
            <span>{todayText}</span>
          </div>

          {/* Quick + New Task CTA */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#24252A] hover:bg-[#33353D] text-white text-xs sm:text-sm font-semibold px-3.5 py-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
