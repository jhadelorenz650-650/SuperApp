import { motion } from 'framer-motion';
import {
  Coffee,
  Flame,
  Infinity as InfinityIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { formatTimerDigits } from '../utils/focusPresets';
import { playLiquidWaveSound, playPenTapSound } from '../utils/soundEffects';

export function FocusTimerDisplay({
  secondsLeft,
  totalSeconds,
  isRunning,
  timerState, // 'work' | 'short_break' | 'long_break'
  currentMode, // 'pomodoro' | 'deep_work' | 'ultradian' | 'flow'
  completedIntervals,
  intervalsBeforeLongBreak = 4,
  onTogglePlay,
  onReset,
  onSkip,
  onToggleZen,
  isZenMode = false,
}) {
  // Calculate progress circle (0% to 100%)
  const isFlow = currentMode.key === 'flow';
  const progressPct = isFlow
    ? 100
    : totalSeconds > 0
      ? Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100))
      : 0;

  // Colors based on state
  const isBreak = timerState === 'short_break' || timerState === 'long_break';
  const ringColor = isBreak ? '#10B981' : isFlow ? '#7C4DFF' : '#4E51BF';
  const ringGlow = isBreak
    ? 'rgba(16, 185, 129, 0.25)'
    : isFlow
      ? 'rgba(124, 77, 255, 0.28)'
      : 'rgba(78, 81, 191, 0.28)';

  // Circumference for 260px SVG circle (radius = 110 => 2 * pi * 110 ≈ 691.15)
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isFlow ? 0 : circumference - (progressPct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* Outer Breathing Halo Ring */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Soft atmospheric radial back-glow */}
        <motion.div
          animate={
            isRunning
              ? {
                  scale: [1, 1.06, 1],
                  opacity: [0.35, 0.65, 0.35],
                }
              : { scale: 1, opacity: 0.25 }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: ringGlow }}
          className="absolute inset-4 rounded-full blur-2xl pointer-events-none"
        />

        {/* SVG Progress Arc */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
          {/* Track Circle */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-[#24252A]/[0.06]"
          />
          {/* Active Animated Progress Arc */}
          <motion.circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: isRunning ? 'stroke-dashoffset 0.6s linear' : 'none',
            }}
          />
        </svg>

        {/* Inner Content (Timer Digits & State Badges) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {/* Status Badge */}
          <div className="mb-2">
            {isBreak ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                <Coffee className="w-3.5 h-3.5" />
                <span>{timerState === 'long_break' ? 'Long Recharge' : 'Short Break'}</span>
              </span>
            ) : isFlow ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7C4DFF]/15 text-[#7C4DFF] border border-[#7C4DFF]/30">
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Open Flowstate</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#4E51BF]/12 text-[#4E51BF] border border-[#4E51BF]/25">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Interval {(completedIntervals % intervalsBeforeLongBreak) + 1} of{' '}
                  {intervalsBeforeLongBreak}
                </span>
              </span>
            )}
          </div>

          {/* Huge Digits */}
          <div
            className={`font-display font-bold tracking-tight text-[#24252A] select-none tabular-nums ${
              isZenMode
                ? 'text-6xl sm:text-7xl lg:text-8xl'
                : 'text-5xl sm:text-6xl'
            }`}
          >
            {formatTimerDigits(secondsLeft)}
          </div>

          {/* Interval Dots for Pomodoro */}
          {!isFlow && (
            <div className="flex items-center gap-1.5 mt-2">
              {Array.from({ length: intervalsBeforeLongBreak }).map((_, i) => {
                const isFinished = i < (completedIntervals % intervalsBeforeLongBreak);
                const isCurrent = i === (completedIntervals % intervalsBeforeLongBreak);
                return (
                  <span
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      isFinished
                        ? 'w-5 bg-emerald-500'
                        : isCurrent && isRunning
                          ? 'w-4 bg-[#4E51BF] animate-pulse'
                          : 'w-2 bg-[#24252A]/15'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center gap-3 mt-4">
        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            playPenTapSound();
            onReset();
          }}
          title="Reset Interval"
          className="p-3 rounded-2xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-[#5C6070] hover:text-[#24252A] shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Big Play / Pause Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playLiquidWaveSound();
            onTogglePlay();
          }}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold shadow-md transition-all cursor-pointer ${
            isBreak
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              : 'bg-[#4E51BF] hover:bg-[#3B3E9E] shadow-[#4E51BF]/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{secondsLeft === totalSeconds && !isFlow ? 'Start Focus' : 'Resume'}</span>
            </>
          )}
        </motion.button>

        {/* Skip / Next Interval */}
        <button
          type="button"
          onClick={() => {
            playPenTapSound();
            onSkip();
          }}
          title={isBreak ? 'End Break early' : 'Skip to Break'}
          className="p-3 rounded-2xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-[#5C6070] hover:text-[#24252A] shadow-sm transition-colors cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Zen Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleZen}
          title={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Fullscreen Focus'}
          className="p-3 rounded-2xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-[#5C6070] hover:text-[#4E51BF] shadow-sm transition-colors cursor-pointer"
        >
          {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
