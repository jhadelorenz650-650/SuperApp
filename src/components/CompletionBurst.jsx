import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';

const DONE_COLORS = ['#4E51BF', '#FF92A4', '#F59E0B', '#10B981', '#24252A', '#6A6DD2'];
const DELETE_COLORS = ['#FF92A4', '#E11D48', '#F59E0B', '#4E51BF', '#24252A', '#FB7185'];

const SPARK_TEMPLATES = [
  { angle: 0, dist: 56, size: 7, shape: 'circle' },
  { angle: 22, dist: 72, size: 6, shape: 'diamond' },
  { angle: 48, dist: 48, size: 8, shape: 'pill' },
  { angle: 72, dist: 68, size: 6, shape: 'circle' },
  { angle: 95, dist: 52, size: 7, shape: 'diamond' },
  { angle: 120, dist: 74, size: 6, shape: 'pill' },
  { angle: 145, dist: 46, size: 7, shape: 'circle' },
  { angle: 170, dist: 66, size: 6, shape: 'diamond' },
  { angle: 196, dist: 58, size: 8, shape: 'pill' },
  { angle: 220, dist: 72, size: 6, shape: 'circle' },
  { angle: 248, dist: 50, size: 7, shape: 'diamond' },
  { angle: 274, dist: 68, size: 6, shape: 'circle' },
  { angle: 300, dist: 54, size: 7, shape: 'pill' },
  { angle: 325, dist: 70, size: 6, shape: 'diamond' },
  { angle: 345, dist: 44, size: 5, shape: 'circle' },
];

export function CompletionBurst({ bursts }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <AnimatePresence>
        {bursts.map((burst) => {
          const isDelete = burst.variant === 'delete';
          const palette = isDelete ? DELETE_COLORS : DONE_COLORS;

          return (
            <div
              key={burst.id}
              style={{ left: burst.x, top: burst.y }}
              className="fixed -translate-x-1/2 -translate-y-1/2"
            >
              {/* Expanding Shockwave Rings */}
              <motion.span
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 3.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute -left-5 -top-5 w-10 h-10 rounded-full border-2 ${
                  isDelete ? 'border-[#FF92A4]' : 'border-[#4E51BF]'
                }`}
              />
              <motion.span
                initial={{ scale: 0.2, opacity: 0.75 }}
                animate={{ scale: 2.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className={`absolute -left-5 -top-5 w-10 h-10 rounded-full ${
                  isDelete ? 'bg-[#FF92A4]/35' : 'bg-[#4E51BF]/25'
                }`}
              />

              {/* Radial Sparks */}
              {SPARK_TEMPLATES.map((spark, idx) => {
                const rad = (spark.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * spark.dist;
                const ty = Math.sin(rad) * spark.dist + 14;
                const color = palette[idx % palette.length];
                const shapeClass =
                  spark.shape === 'diamond' ? 'rounded-[2px] rotate-45' : 'rounded-full';

                return (
                  <motion.span
                    key={idx}
                    initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
                    animate={{
                      x: tx,
                      y: ty,
                      scale: [0.6, 1.25, 0],
                      opacity: [1, 1, 0],
                      rotate: spark.shape === 'circle' ? 0 : 160,
                    }}
                    transition={{
                      duration: 0.72,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      width: spark.shape === 'pill' ? spark.size + 4 : spark.size,
                      height: spark.shape === 'pill' ? Math.max(3, spark.size - 3) : spark.size,
                      backgroundColor: color,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 ${shapeClass}`}
                  />
                );
              })}

              {/* Floating Action Badge */}
              <motion.div
                initial={{ y: -6, scale: 0.65, opacity: 0 }}
                animate={{
                  y: -48,
                  scale: [0.7, 1.08, 1],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 0.85,
                  times: [0, 0.22, 0.65, 1],
                  ease: 'easeOut',
                }}
                className={`absolute left-0 top-0 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-display font-bold whitespace-nowrap shadow-md ${
                  isDelete
                    ? 'bg-[#FF92A4] text-[#24252A]'
                    : 'bg-[#4E51BF] text-white'
                }`}
              >
                {isDelete ? (
                  <>
                    <Trash2 className="w-3 h-3" />
                    Deleted
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#FFE9CE]" />
                    Done!
                  </>
                )}
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
