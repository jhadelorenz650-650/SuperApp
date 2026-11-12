import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  SearchX,
} from 'lucide-react';
import { CompletionBurst } from '../components/CompletionBurst';
import { EmptyState } from '../components/EmptyState';
import { MiniCalendar } from '../components/MiniCalendar';
import { PageTransition } from '../components/PageTransition';
import { TaskCard } from '../components/TaskCard';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getCompletedThisWeekCount,
  getTaskStreak,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/taskDates';
import { playTaskDeleteSound, playTaskDoneSound } from '../utils/soundEffects';
import { PRIORITY_CONFIG } from '../utils/taskStyles';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function Tasks({
  tasks,
  searchQuery = '',
  onClearSearch,
  onOpenNewTask,
  onToggleTask,
  onDeleteTask,
}) {
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(() => new Date());
  const [bursts, setBursts] = useState([]);
  const burstTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      burstTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const hasDueToday = useMemo(
    () => tasks.some((t) => isTaskDueToday(t, now)),
    [tasks, now]
  );
  const isFinalHourCountdown = hasDueToday && now.getHours() === 23;

  useEffect(() => {
    if (isFinalHourCountdown) {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
    }
    if (tasks.length > 0) {
      const intervalMs = hasDueToday ? 15000 : 30000;
      const id = setInterval(() => setNow(new Date()), intervalMs);
      return () => clearInterval(id);
    }

    let midnightTimer = null;
    const scheduleMidnight = () => {
      const current = new Date();
      const nextMidnight = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
        0,
        0,
        1
      );
      midnightTimer = setTimeout(() => {
        setNow(new Date());
        scheduleMidnight();
      }, Math.max(1000, nextMidnight.getTime() - current.getTime()));
    };
    scheduleMidnight();
    return () => {
      if (midnightTimer !== null) clearTimeout(midnightTimer);
    };
  }, [isFinalHourCountdown, hasDueToday, tasks.length]);

  const spawnBurst = (event, variant) => {
    const rect = event?.rect || event?.currentTarget?.getBoundingClientRect?.();
    const x = rect
      ? rect.left + rect.width / 2
      : event?.clientX || window.innerWidth / 2;
    const y = rect
      ? rect.top + rect.height / 2
      : event?.clientY || window.innerHeight / 2;
    const burstId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setBursts((prev) => [...prev, { id: burstId, x, y, variant }]);
    const cleanupTimer = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 950);
    burstTimersRef.current.push(cleanupTimer);
  };

  const handleToggleWithEffect = (task, event) => {
    if (!task.completed) {
      spawnBurst(event, 'done');
      playTaskDoneSound();
    }
    onToggleTask(task.id);
  };

  const handleDeleteWithEffect = (taskId, event) => {
    spawnBurst(event, 'delete');
    playTaskDeleteSound();
    onDeleteTask(taskId);
  };

  const stats = useMemo(() => {
    const dueToday = tasks.filter((t) => isTaskDueToday(t, now)).length;
    const overdue = tasks.filter((t) => isTaskOverdue(t, now)).length;
    const completedWeek = getCompletedThisWeekCount(tasks, now);
    const streak = getTaskStreak(tasks, now);
    const active = tasks.filter((t) => !t.completed).length;
    const completed = tasks.length - active;

    return {
      dueToday,
      overdue,
      completedWeek,
      streak,
      counts: { all: tasks.length, active, completed },
    };
  }, [tasks, now]);

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (query) {
        const matchTitle = (task.title || '').toLowerCase().includes(query);
        const matchSubject = (task.subject || '').toLowerCase().includes(query);
        return matchTitle || matchSubject;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate !== b.dueDate) {
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      }
      const rankDiff =
        (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
      if (rankDiff !== 0) return rankDiff;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  }, [tasks, filter, searchQuery]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 5);
  }, [tasks]);

  const statChips = [
    {
      label: 'Due today',
      value: stats.dueToday,
      icon: CalendarClock,
      iconBg: 'bg-[#EAF0FC]',
      iconColor: 'text-[#2F59B8]',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      iconBg: stats.overdue > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      iconColor: stats.overdue > 0 ? 'text-rose-700' : 'text-emerald-700',
    },
    {
      label: 'Done this week',
      value: stats.completedWeek,
      icon: CheckCircle2,
      iconBg: 'bg-[#ECE9E1]',
      iconColor: 'text-[#121316]',
    },
    {
      label: 'Streak',
      value: `${stats.streak}d`,
      icon: Flame,
      iconBg: 'bg-[#121316]',
      iconColor: 'text-[#5B8DEF]',
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <CompletionBurst bursts={bursts} />

      {/* Top Animated Stats Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statChips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <motion.div
              key={chip.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
              className="glass-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl ${chip.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-4 h-4 ${chip.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg sm:text-xl font-bold text-[#121316] leading-none tabular-nums">
                  {chip.value}
                </div>
                <div className="text-[11px] text-[#424652] mt-1 truncate">
                  {chip.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Main Workspace + Wide-Screen Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Left: Roomy Filter & Task List */}
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="glass-card inline-flex w-full sm:w-auto p-1 rounded-2xl">
              {FILTERS.map((item) => {
                const isActive = filter === item.key;
                return (
                  <motion.button
                    key={item.key}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setFilter(item.key)}
                    className={`relative flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#FAF9F6]'
                        : 'text-[#424652] hover:text-[#121316]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="taskFilterIndicator"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-[#121316] shadow-sm"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                      {item.label}
                      <span
                        className={`text-[11px] tabular-nums ${
                          isActive ? 'text-[#9EC0FF]' : 'text-[#6E7382]'
                        }`}
                      >
                        {stats.counts[item.key]}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {searchQuery.trim() && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF0FC] border border-[#5B8DEF]/35 text-xs text-[#2F59B8] font-medium">
                <span>Filtering: “{searchQuery.trim()}”</span>
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="text-[#121316] hover:underline font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Animated Task List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  now={now}
                  onToggle={handleToggleWithEffect}
                  onDelete={handleDeleteWithEffect}
                />
              ))}
            </AnimatePresence>

            {visibleTasks.length === 0 && (
              searchQuery.trim() ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-card p-8 text-center"
                >
                  <SearchX className="w-8 h-8 text-[#6E7382] mx-auto mb-3" />
                  <h3 className="font-display text-base font-semibold text-[#121316]">
                    No matching tasks
                  </h3>
                  <p className="text-xs text-[#424652] mt-1">
                    No tasks matched “{searchQuery.trim()}” in this view.
                  </p>
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#121316] hover:bg-[#23252C] text-xs font-semibold text-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                </motion.div>
              ) : (
                <EmptyState
                  title={
                    filter === 'all'
                      ? 'Your task board is clear'
                      : `No ${filter} tasks right now`
                  }
                  description={
                    filter === 'all'
                      ? 'Create an assignment with a subject, priority, and due date to start tracking.'
                      : 'Switch filters above or add a new task to keep momentum going.'
                  }
                  ctaLabel="New Task"
                  onAction={onOpenNewTask}
                />
              )
            )}
          </div>
        </div>

        {/* Right: Mini Calendar & Upcoming Deadlines (Wide Screens) */}
        <aside className="hidden lg:flex lg:flex-col gap-5 sticky top-24">
          <MiniCalendar tasks={tasks} />

          <div className="glass-card rounded-panel p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-display text-sm font-semibold text-[#121316]">
                Upcoming Deadlines
              </h3>
              <span className="text-[11px] font-medium text-[#6E7382] tabular-nums">
                {upcomingDeadlines.length} active
              </span>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((task) => {
                  const countdown = formatDeadlineCountdown(
                    task.dueDate,
                    task.completed,
                    now
                  );
                  const priorityMeta =
                    PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl bg-white border border-[#121316]/[0.09] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityMeta.dotClass}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#121316] truncate">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="text-[11px] text-[#6E7382] tabular-nums">
                              {formatShortDate(task.dueDate)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                countdown.status === 'overdue'
                                  ? 'text-rose-700'
                                  : countdown.status === 'today'
                                    ? 'text-[#121316]'
                                    : 'text-[#2F59B8]'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {countdown.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6E7382] py-3 text-center">
                No upcoming deadlines yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
