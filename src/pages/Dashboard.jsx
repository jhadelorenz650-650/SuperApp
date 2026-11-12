import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { ProgressRing } from '../components/ProgressRing';
import { WeeklyChart } from '../components/WeeklyChart';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getCoverTheme } from '../utils/notebookPresets';
import {
  formatDeadlineCountdown,
  formatShortDate,
  formatTodayHeader,
  getGreetingByTime,
  getWeeklyActivityData,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/taskDates';
import { getSubjectStyle, PRIORITY_CONFIG } from '../utils/taskStyles';

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Dashboard({ tasks }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const dueTodayCount = tasks.filter((t) => isTaskDueToday(t, now)).length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t, now)).length;
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const weeklyData = useMemo(() => getWeeklyActivityData(tasks, now), [tasks, now]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 4);
  }, [tasks]);

  const [notebooks] = useLocalStorage('superapp_notebooks_v1', []);

  const handleOpenNotebook = (notebookId) => {
    if (notebookId) {
      try {
        window.sessionStorage.setItem('superapp_active_notebook_id_v1', notebookId);
      } catch {
        // Ignore
      }
    }
    navigate('/notes');
  };

  return (
    <PageTransition>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4 sm:gap-5"
      >
        {/* 1. Greeting Hero Card (Ink Black + Paper White editorial split with Cornflower accent) */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-6 xl:col-span-8 glass-card relative overflow-hidden rounded-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
        >
          {/* Top-right Cornflower Blue accent block */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 w-44 h-36 bg-[#5B8DEF] rounded-bl-[2.5rem] opacity-95"
          />

          <div className="relative grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-4 items-stretch">
            {/* Warm Peach Greeting Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#121316] p-5 sm:p-6 flex flex-col justify-between min-h-[156px]">
              {/* Reference white circle + cobalt dot detail */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/90"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-9 right-9 w-2.5 h-2.5 rounded-full bg-[#5B8DEF]"
              />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#D8DCE6] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  <span>{formatTodayHeader(now)}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF9F6]">
                  {getGreetingByTime(now)}, Jhade
                </h2>
                <p className="text-xs sm:text-sm text-[#B9B5AC] mt-1.5 max-w-md leading-relaxed">
                  {overdueCount > 0
                    ? `You have ${overdueCount} overdue assignment${overdueCount > 1 ? 's' : ''} and ${dueTodayCount} due today.`
                    : dueTodayCount > 0
                      ? `${dueTodayCount} assignment${dueTodayCount > 1 ? 's' : ''} due today. Stay locked in.`
                      : 'Your schedule looks clear today. Plan ahead or knock out an upcoming deadline.'}
                </p>
              </div>

              <div className="relative pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/tasks')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF9F6] hover:bg-white text-[#121316] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Open Tasks
                  <ArrowRight className="w-3.5 h-3.5 text-[#3762C4]" />
                </motion.button>
              </div>
            </div>

            {/* Right KPI Stack */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/tasks')}
                className="text-left rounded-2xl bg-[#FAF9F6] hover:bg-white border border-[#121316]/[0.09] p-4 shadow-sm transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-medium text-[#424652]">Due Today</div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-[#121316] mt-0.5 tabular-nums">
                    {dueTodayCount}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EAF0FC] flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-[#3762C4]" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/tasks')}
                className={`text-left rounded-2xl border p-4 shadow-sm transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  overdueCount > 0
                    ? 'bg-[#EAF0FC] hover:bg-[#DCE7FA] border-[#5B8DEF]/45'
                    : 'bg-[#FAF9F6] hover:bg-white border-[#121316]/[0.09]'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-[#424652]">Overdue</div>
                  <div
                    className={`font-display text-2xl sm:text-3xl font-bold mt-0.5 ${
                      overdueCount > 0 ? 'text-[#2F59B8]' : 'text-[#121316]'
                    }`}
                  >
                    {overdueCount}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    overdueCount > 0 ? 'bg-[#3762C4]' : 'bg-[#ECE9E1]'
                  }`}
                >
                  {overdueCount > 0 ? (
                    <AlertCircle className="w-5 h-5 text-white" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* 2. Animated Progress Ring Card */}
        <motion.section
          variants={cardVariants}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/tasks')}
          className="md:col-span-3 xl:col-span-4 glass-card glass-card-interactive relative overflow-hidden rounded-panel p-6 flex items-center cursor-pointer"
        >
          <ProgressRing
            percentage={completionPct}
            completedCount={completedCount}
            totalCount={totalCount}
          />
        </motion.section>

        {/* 3. Weekly Activity Bar Chart (Recharts) */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-3 xl:col-span-5 glass-card rounded-panel p-5 sm:p-6 min-h-[260px]"
        >
          <WeeklyChart data={weeklyData} />
        </motion.section>

        {/* 4. Upcoming Deadlines Card */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-6 xl:col-span-4 glass-card rounded-panel p-5 sm:p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-sm sm:text-base font-semibold text-[#121316]">
                Upcoming Deadlines
              </h3>
              <p className="text-xs text-[#424652] mt-0.5">
                Next active assignments
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-[#2F59B8] hover:text-[#121316] transition-colors cursor-pointer"
            >
              See all
            </button>
          </div>

          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-2.5 flex-1">
              {upcomingDeadlines.map((task) => {
                const countdown = formatDeadlineCountdown(task.dueDate, task.completed, now);
                const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const subjectStyle = getSubjectStyle(task.subject);

                return (
                  <motion.button
                    key={task.id}
                    type="button"
                    whileHover={{ x: 2 }}
                    onClick={() => navigate('/tasks')}
                    className="w-full text-left rounded-2xl bg-[#FAF9F6] hover:bg-[#FFFFFF] border border-[#121316]/[0.08] px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityMeta.dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-[#121316] truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${subjectStyle.chipClass}`}
                        >
                          {task.subject || 'General'}
                        </span>
                        <span className="text-[11px] text-[#6E7382]">
                          {formatShortDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 tabular-nums ${
                        countdown.status === 'overdue'
                          ? 'text-[#121316]'
                          : countdown.status === 'today'
                            ? 'text-[#2F59B8]'
                            : 'text-[#424652]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {countdown.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <CheckCircle2 className="w-7 h-7 text-[#3762C4] mb-2" />
              <p className="text-xs font-semibold text-[#121316]">
                No pending deadlines
              </p>
              <p className="text-[11px] text-[#6E7382] mt-0.5">
                Use + New Task in the top bar anytime.
              </p>
            </div>
          )}
        </motion.section>

        {/* 5. Study Notes Card (Replaces the static quote card) */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-6 xl:col-span-3 glass-card rounded-panel p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#121316] flex items-center justify-center shrink-0">
                  <NotebookPen className="w-4 h-4 text-[#5B8DEF]" />
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#121316]">
                    Study Notes
                  </h3>
                  <p className="text-[11px] text-[#424652]">
                    {notebooks.length} notebook{notebooks.length !== 1 ? 's' : ''} active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="text-xs font-semibold text-[#2F59B8] hover:text-[#121316] transition-colors cursor-pointer"
              >
                All
              </button>
            </div>

            {notebooks.length > 0 ? (
              <div className="space-y-2 mt-3">
                {notebooks.slice(0, 3).map((nb) => {
                  const theme = getCoverTheme(nb.coverColor);
                  return (
                    <motion.button
                      key={nb.id}
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleOpenNotebook(nb.id)}
                      className="w-full text-left rounded-xl bg-[#FAF9F6] hover:bg-[#FFFFFF] border border-[#121316]/[0.08] p-2.5 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div
                        className={`w-3.5 h-7 rounded-sm bg-gradient-to-br ${theme.coverBg} shrink-0 shadow-xs`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#121316] truncate group-hover:text-[#2F59B8] transition-colors">
                          {nb.name || nb.title || 'Untitled Notebook'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#6E7382] mt-0.5">
                          <span>{nb.subject || 'General'}</span>
                          <span>•</span>
                          <span>{nb.pages?.length || 1} p.</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6E7382] group-hover:text-[#3762C4] group-hover:translate-x-0.5 transition-all" />
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <BookOpen className="w-6 h-6 text-[#3762C4] mx-auto mb-2 opacity-75" />
                <p className="text-xs font-semibold text-[#121316]">No notebooks yet</p>
                <p className="text-[11px] text-[#6E7382] mt-0.5">
                  Create a notebook to begin sketching
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-[#121316]/[0.08]">
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/notes')}
              className="w-full py-2 px-3 rounded-xl bg-[#3762C4] hover:bg-[#2F59B8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <NotebookPen className="w-3.5 h-3.5 text-[#EAF0FC]" />
              Open Notebooks
            </motion.button>
          </div>
        </motion.section>
      </motion.div>
    </PageTransition>
  );
}
