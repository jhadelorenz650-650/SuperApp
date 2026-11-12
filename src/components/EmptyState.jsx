import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';

export function EmptyState({
  title = 'Nothing on your plate yet',
  description = 'Add your next assignment, lab report, or exam deadline to stay ahead.',
  ctaLabel = 'New Task',
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-card p-8 sm:p-10 text-center"
    >
      {/* Custom SVG + Lucide Illustration */}
      <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="48"
            stroke="#5B8DEF"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <rect
            x="28"
            y="34"
            width="64"
            height="52"
            rx="14"
            fill="#FAF9F6"
            stroke="#121316"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          <line
            x1="44"
            y1="52"
            x2="76"
            y2="52"
            stroke="#121316"
            strokeOpacity="0.55"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="44"
            y1="64"
            x2="66"
            y2="64"
            stroke="#5B8DEF"
            strokeOpacity="0.85"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-1 top-2 w-8 h-8 rounded-xl bg-[#3762C4] flex items-center justify-center shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
        <Sparkles className="absolute left-1 bottom-2 w-4 h-4 text-[#5B8DEF]" />
      </div>

      <h3 className="font-display text-lg font-semibold text-[#121316]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#424652] max-w-sm mx-auto mt-1.5 leading-relaxed">
        {description}
      </p>

      {onAction && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#121316] hover:bg-[#23252C] text-[#FAF9F6] text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#5B8DEF]" />
          {ctaLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
