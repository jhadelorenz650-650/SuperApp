import { motion } from 'framer-motion';

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
  accentClass = 'from-[#FFE9CE] via-[#FF92A4]/30 to-[#4E51BF]/20',
}) {
  return (
    <div className="flex items-center justify-center py-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2 }}
        className="glass-card glass-card-interactive relative w-full max-w-md overflow-hidden rounded-panel p-8 text-center"
      >
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-br ${accentClass} blur-3xl opacity-80`}
        />

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mx-auto w-16 h-16 rounded-2xl bg-[#FFE9CE] border border-[#F2CFA4]/60 flex items-center justify-center mb-5 shadow-sm"
        >
          <Icon className="w-8 h-8 text-[#4E51BF]" />
        </motion.div>

        <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4E51BF]/10 border border-[#4E51BF]/20 text-[#4E51BF] text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF92A4] animate-pulse" />
          Coming soon
        </div>

        <h2 className="relative font-display text-xl font-semibold text-[#24252A] tracking-tight">
          {title}
        </h2>
        <p className="relative text-sm text-[#5C6070] mt-2 leading-relaxed">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
