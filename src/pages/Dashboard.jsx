import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Quote,
  Sparkles,
} from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { ProgressRing } from '../components/ProgressRing';
import { WeeklyChart } from '../components/WeeklyChart';
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

const QUOTES = [
  {
    text: 'Small consistent study blocks beat last-minute cramming every single time.',
    author: 'Focus Principle',
  },
  {
    text: 'Clarity comes from action. Pick the smallest next step and start.',
    author: 'Study Flow',
  },
  {
    text: 'Protect your deep work hours like your hardest deadline depends on it.',
    author: 'Academic Craft',
  },
];

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

  const quote = QUOTES[now.getDate() % QUOTES.length];

  return (
    <PageTransition>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4 sm:gap-5"
      >
        {/* 1. Greeting Hero Card (#4E51BF + #FFE9CE signature pairing) */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-6 xl:col-span-8 glass-card relative overflow-hidden rounded-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
        >
          {/* Top-right cobalt accent block matching reference */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 w-44 h-36 bg-[#4E51BF] rounded-bl-[2.5rem] opacity-95"
          />

          <div className="relative grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-4 items-stretch">
            {/* Warm Peach Greeting Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#FFE9CE] p-5 sm:p-6 flex flex-col justify-between min-h-[156px]">
              {/* Reference white circle + cobalt dot detail */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/90"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-9 right-9 w-2.5 h-2.5 rounded-full bg-[#4E51BF]"
              />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5C4630] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4E51BF]" />
                  <span>{formatTodayHeader(now)}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#24252A]">
                  {getGreetingByTime(now)}, Jhade
                </h2>
                <p className="text-xs sm:text-sm text-[#5C4630] mt-1.5 max-w-md leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#24252A] hover:bg-[#33353D] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Open Tasks
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFE9CE]" />
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
                className="text-left rounded-2xl bg-white/95 hover:bg-white border border-[#24252A]/[0.08] p-4 shadow-sm transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-medium text-[#5C6070]">Due Today</div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-[#24252A] mt-0.5">
                    {dueTodayCount}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#4E51BF]/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-[#4E51BF]" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/tasks')}
                className={`text-left rounded-2xl border p-4 shadow-sm transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  overdueCount > 0
                    ? 'bg-[#FF92A4]/20 hover:bg-[#FF92A4]/30 border-[#FF92A4]/50'
                    : 'bg-white/95 hover:bg-white border-[#24252A]/[0.08]'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-[#5C6070]">Overdue</div>
                  <div
                    className={`font-display text-2xl sm:text-3xl font-bold mt-0.5 ${
                      overdueCount > 0 ? 'text-[#9F1239]' : 'text-[#24252A]'
                    }`}
                  >
                    {overdueCount}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    overdueCount > 0 ? 'bg-[#FF92A4]/35' : 'bg-emerald-500/12'
                  }`}
                >
                  {overdueCount > 0 ? (
                    <AlertCircle className="w-5 h-5 text-[#9F1239]" />
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
              <h3 className="font-display text-sm sm:text-base font-semibold text-[#24252A]">
                Upcoming Deadlines
              </h3>
              <p className="text-xs text-[#5C6070] mt-0.5">
                Next active assignments
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-[#4E51BF] hover:text-[#3B3E9E] transition-colors cursor-pointer"
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
                    className="w-full text-left rounded-2xl bg-[#F6F7FC] hover:bg-[#ECEEF9] border border-[#24252A]/[0.06] px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityMeta.dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-[#24252A] truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${subjectStyle.chipClass}`}
                        >
                          {task.subject || 'General'}
                        </span>
                        <span className="text-[11px] text-[#8A8F9E]">
                          {formatShortDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${
                        countdown.status === 'overdue'
                          ? 'text-[#9F1239]'
                          : countdown.status === 'today'
                            ? 'text-[#9A5B13]'
                            : 'text-[#4E51BF]'
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
              <CheckCircle2 className="w-7 h-7 text-[#4E51BF] mb-2" />
              <p className="text-xs font-semibold text-[#24252A]">
                No pending deadlines
              </p>
              <p className="text-[11px] text-[#8A8F9E] mt-0.5">
                Use + New Task in the top bar anytime.
              </p>
            </div>
          )}
        </motion.section>

        {/* 5. Motivational Quote Card (#4E51BF Cobalt Signature Card) */}
        <motion.section
          variants={cardVariants}
          className="md:col-span-6 xl:col-span-3 relative overflow-hidden rounded-panel bg-[#4E51BF] text-white p-5 sm:p-6 flex flex-col justify-between shadow-lg shadow-[#4E51BF]/20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#FF92A4]/35 blur-2xl"
          />

          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-[#FFE9CE] flex items-center justify-center mb-4">
              <Quote className="w-4 h-4 text-[#24252A]" />
            </div>
            <p className="font-display text-base sm:text-lg font-medium leading-snug text-white">
              “{quote.text}”
            </p>
          </div>

          <div className="relative pt-5 mt-5 border-t border-white/15 flex items-center justify-between text-xs text-white/75">
            <span>Daily Mindframe</span>
            <span className="text-[#FFE9CE] font-semibold">{quote.author}</span>
          </div>
        </motion.section>
      </motion.div>
    </PageTransition>
  );
}
