import { motion } from 'framer-motion';

export function ProgressRing({
  percentage = 0,
  completedCount = 0,
  totalCount = 0,
  size = 112,
  strokeWidth = 10,
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B8DEF" />
              <stop offset="100%" stopColor="#3762C4" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E6E2D8"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-bold tracking-tight text-[#121316] tabular-nums">
            {clamped}%
          </span>
          <span className="text-[11px] text-[#6E7382]">done</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider text-[#6E7382]">
          Completion
        </div>
        <div className="font-display text-xl font-semibold text-[#121316] mt-0.5 tabular-nums">
          {completedCount} of {totalCount}
        </div>
        <div className="text-xs text-[#424652] mt-1">
          {totalCount === 0
            ? 'Add tasks to track progress'
            : completedCount === totalCount
              ? 'All tasks wrapped up!'
              : `${totalCount - completedCount} remaining`}
        </div>
      </div>
    </div>
  );
}
