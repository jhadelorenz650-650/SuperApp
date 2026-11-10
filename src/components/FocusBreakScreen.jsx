import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee,
  Eye,
  Heart,
  RotateCcw,
  SkipForward,
  Sparkles,
  Wind,
} from 'lucide-react';
import { BREAK_ACTIVITIES } from '../utils/focusPresets';

export function FocusBreakScreen({ onSkipBreak, onExtendBreak }) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // 'Inhale' (4s) -> 'Hold' (7s) -> 'Exhale' (8s)

  // Guided 4-7-8 Breathwork cycle
  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const runCycle = () => {
      if (!isMounted) return;
      setBreathPhase('Inhale');
      timerId = setTimeout(() => {
        if (!isMounted) return;
        setBreathPhase('Hold');
        timerId = setTimeout(() => {
          if (!isMounted) return;
          setBreathPhase('Exhale');
          timerId = setTimeout(() => {
            if (!isMounted) return;
            runCycle();
          }, 8000);
        }, 7000);
      }, 4000);
    };

    runCycle();
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const currentActivity = BREAK_ACTIVITIES[activityIndex % BREAK_ACTIVITIES.length];

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-emerald-500/25 bg-gradient-to-b from-[#F0FDF4] to-white relative overflow-hidden text-center space-y-5">
      {/* Top Banner */}
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/30">
          <Coffee className="w-3.5 h-3.5" />
          <span>Restorative Break Mode</span>
        </span>

        <button
          type="button"
          onClick={() => setActivityIndex((prev) => prev + 1)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
        >
          Next Prompt →
        </button>
      </div>

      {/* Guided Breathing Visualizer */}
      <div className="py-3 flex flex-col items-center justify-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <motion.div
            animate={
              breathPhase === 'Inhale'
                ? { scale: [1, 1.45], opacity: [0.4, 0.8] }
                : breathPhase === 'Hold'
                  ? { scale: 1.45, opacity: 0.85 }
                  : { scale: [1.45, 1], opacity: [0.85, 0.4] }
            }
            transition={{
              duration: breathPhase === 'Inhale' ? 4 : breathPhase === 'Hold' ? 7 : 8,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-emerald-400/30 blur-lg"
          />

          <motion.div
            animate={
              breathPhase === 'Inhale'
                ? { scale: [1, 1.35] }
                : breathPhase === 'Hold'
                  ? { scale: 1.35 }
                  : { scale: [1.35, 1] }
            }
            transition={{
              duration: breathPhase === 'Inhale' ? 4 : breathPhase === 'Hold' ? 7 : 8,
              ease: 'easeInOut',
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex flex-col items-center justify-center text-white select-none"
          >
            <Wind className="w-5 h-5 mb-0.5 opacity-90" />
            <span className="text-xs font-bold tracking-wide">{breathPhase}</span>
          </motion.div>
        </div>
        <p className="text-[11px] font-semibold text-emerald-800 mt-2">
          4-7-8 Breathing: reset your mental bandwidth
        </p>
      </div>

      {/* Activity Prompt Card */}
      <div className="rounded-xl bg-white/90 p-4 border border-emerald-200 shadow-xs max-w-md mx-auto text-left flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#24252A] flex items-center gap-2">
            <span>{currentActivity.title}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentActivity.tag}
            </span>
          </div>
          <p className="text-xs text-[#5C6070] mt-1 leading-relaxed">
            {currentActivity.instruction}
          </p>
        </div>
      </div>

      {/* Break Quick Actions */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={onExtendBreak}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 transition-colors cursor-pointer"
        >
          +2 min Break
        </button>

        <button
          type="button"
          onClick={onSkipBreak}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>End Break & Focus</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
