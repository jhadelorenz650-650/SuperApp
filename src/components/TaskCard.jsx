import { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getDeadlineProgress,
} from '../utils/taskDates';
import { getSubjectStyle, PRIORITY_CONFIG } from '../utils/taskStyles';

const COUNTDOWN_STYLES = {
  overdue: 'bg-rose-50 text-rose-800 border-rose-300',
  today: 'bg-[#121316] text-[#FAF9F6] border-[#121316]',
  soon: 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/35',
  upcoming: 'bg-[#ECE9E1] text-[#424652] border-[#121316]/[0.12]',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  neutral: 'bg-[#ECE9E1] text-[#424652] border-[#121316]/[0.12]',
};

const PROGRESS_BAR_STYLES = {
  overdue: 'from-rose-500 to-rose-700',
  today: 'from-[#121316] to-[#5B8DEF]',
  soon: 'from-[#5B8DEF] to-[#3762C4]',
  upcoming: 'from-[#5B8DEF] to-[#8FB2F5]',
  completed: 'from-[#5B8DEF] to-emerald-500',
  neutral: 'from-stone-300 to-stone-400',
};

const BURST_PARTICLES = [
  { angle: 0, color: '#5B8DEF' },
  { angle: 45, color: '#121316' },
  { angle: 90, color: '#3762C4' },
  { angle: 135, color: '#9EC0FF' },
  { angle: 180, color: '#5B8DEF' },
  { angle: 225, color: '#121316' },
  { angle: 270, color: '#3762C4' },
  { angle: 315, color: '#424652' },
];

export function TaskCard({ task, now, onToggle, onDelete }) {
  const [burstId, setBurstId] = useState(0);
  const deleteBtnRef = useRef(null);
  const dragX = useMotionValue(0);
  const swipeBackdropOpacity = useTransform(dragX, [0, -14, -72], [0, 0.85, 1]);
  const countdown = formatDeadlineCountdown(task.dueDate, task.completed, now);
  const progress = getDeadlineProgress(task, now);
  const shortDate = formatShortDate(task.dueDate);
  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const subjectStyle = getSubjectStyle(task.subject);

  const handleToggle = (e) => {
    if (!task.completed) {
      setBurstId((prev) => prev + 1);
    }
    onToggle(task, e);
  };

  const handleDragEnd = (_event, info) => {
    if (info.offset.x < -80) {
      const rect = deleteBtnRef.current?.getBoundingClientRect?.();
      onDelete(task.id, rect ? { rect } : null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -48, scale: 0.95 }}
      transition={{
        layout: { type: 'spring', stiffness: 420, damping: 34 },
        opacity: { duration: 0.2 },
        y: { duration: 0.22 },
      }}
      className="relative rounded-card overflow-hidden"
    >
      {/* Swipe-to-delete reveal backdrop (hidden until swiped left so it never bleeds behind the card) */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: swipeBackdropOpacity }}
        className="pointer-events-none absolute inset-0 rounded-card bg-rose-50 border border-rose-300 flex items-center justify-end pr-5"
      >
        <div className="flex items-center gap-1.5 text-rose-800 text-xs font-semibold">
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </div>
      </motion.div>

      {/* Foreground interactive paper card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.4, right: 0.05 }}
        onDragEnd={handleDragEnd}
        whileHover={{ y: -1 }}
        animate={burstId > 0 ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        style={{ x: dragX, touchAction: 'pan-y' }}
        className="glass-card glass-card-interactive relative rounded-card !bg-[#FAF9F6] hover:!bg-white p-4 sm:p-4.5 pl-5 overflow-hidden"
      >
        {/* Completion Sweep Shimmer */}
        <AnimatePresence>
          {burstId > 0 && (
            <motion.div
              key={`sweep-${burstId}`}
              aria-hidden="true"
              initial={{ x: '-110%', opacity: 0.85 }}
              animate={{ x: '130%', opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#5B8DEF]/25 to-transparent skew-x-[-20deg] z-20"
            />
          )}
        </AnimatePresence>

        {/* Priority Left Color Strip */}
        <div
          aria-hidden="true"
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${priorityMeta.stripClass}`}
        />

        <div
          className={`flex items-start gap-3.5 transition-opacity ${
            task.completed ? 'opacity-75' : ''
          }`}
        >
          {/* Particle-Burst Animated Circular Check */}
          <div className="relative mt-0.5 shrink-0">
            <AnimatePresence>
              {burstId > 0 && (
                <div
                  key={burstId}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  {BURST_PARTICLES.map(({ angle, color }, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    const dist = 20;
                    return (
                      <motion.span
                        key={idx}
                        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                        animate={{
                          x: Math.cos(rad) * dist,
                          y: Math.sin(rad) * dist,
                          scale: 0,
                          opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        style={{ backgroundColor: color }}
                        className="absolute w-1.5 h-1.5 rounded-full"
                      />
                    );
                  })}
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0.7 }}
                    animate={{ scale: 2.1, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border border-[#5B8DEF]"
                  />
                </div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.82 }}
              aria-label={task.completed ? 'Mark task active' : 'Mark task complete'}
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                task.completed
                  ? 'bg-[#3762C4] border-[#3762C4] shadow-sm'
                  : 'bg-white border-[#121316]/30 hover:border-[#5B8DEF]'
              }`}
            >
              {task.completed && (
                <svg
                  className="w-3.5 h-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`text-sm sm:text-[15px] font-semibold leading-snug break-words transition-colors ${
                  task.completed ? 'line-through text-[#6E7382]' : 'text-[#121316]'
                }`}
              >
                {task.title}
              </h3>

              <motion.button
                ref={deleteBtnRef}
                type="button"
                onClick={(e) => onDelete(task.id, e)}
                whileHover={{ scale: 1.12, rotate: -6 }}
                whileTap={{ scale: 0.82 }}
                aria-label="Delete task"
                className="p-1.5 -mr-1 -mt-1 rounded-lg text-[#6E7382] hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {/* Colored Subject Chip */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${subjectStyle.chipClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${subjectStyle.dotClass}`} />
                {task.subject || 'General'}
              </span>

              {/* Priority Chip */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${priorityMeta.badgeClass}`}
              >
                {priorityMeta.label}
              </span>

              {/* Live Deadline Countdown */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  COUNTDOWN_STYLES[countdown.status]
                }`}
              >
                <Clock className="w-3 h-3" />
                {countdown.label}
              </span>

              {/* Short Due Date */}
              {shortDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#424652] ml-auto tabular-nums">
                  <Calendar className="w-3 h-3" />
                  {shortDate}
                </span>
              )}
            </div>

            {/* Deadline Approach Progress Bar */}
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-1.5 flex-1 rounded-full bg-[#ECE9E1] overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    PROGRESS_BAR_STYLES[progress.status]
                  }`}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#6E7382] tabular-nums">
                {progress.percent}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
