import { motion } from 'framer-motion';
import {
  CheckCircle2,
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
  onFinishFlow,
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

  // Colors based on state (90% Paper/Ink + 10% Cornflower Blue)
  const isBreak = timerState === 'short_break' || timerState === 'long_break';
  const ringColor = isBreak ? '#10B981' : isFlow ? '#3762C4' : '#5B8DEF';
  const ringGlow = isBreak
    ? 'rgba(16, 185, 129, 0.22)'
    : 'rgba(91, 141, 239, 0.25)';

  // Circumference for 260px SVG circle (radius = 118 => 2 * pi * 118 ≈ 741.42)
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
            className={isZenMode ? 'text-white/12' : 'text-[#ECE9E1]'}
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
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isZenMode
                    ? 'bg-[#5B8DEF]/20 text-[#9EC0FF] border-[#5B8DEF]/35'
                    : 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/35'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Open Flowstate</span>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isZenMode
                    ? 'bg-[#5B8DEF]/20 text-[#9EC0FF] border-[#5B8DEF]/35'
                    : 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/35'
                }`}
              >
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
            className={`font-display font-bold tracking-tight select-none tabular-nums ${
              isZenMode ? 'text-[#FAF9F6]' : 'text-[#121316]'
            } ${
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
                        ? 'w-5 bg-[#5B8DEF]'
                        : isCurrent && isRunning
                          ? 'w-4 bg-[#3762C4] animate-pulse'
                          : isZenMode
                            ? 'w-2 bg-white/20'
                            : 'w-2 bg-[#121316]/15'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            playPenTapSound();
            onReset();
          }}
          title="Reset Interval"
          aria-label="Reset Interval"
          className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
            isZenMode
              ? 'bg-white/10 hover:bg-white/20 border-white/15 text-[#FAF9F6]'
              : 'bg-white hover:bg-[#EAF0FC] border-[#121316]/[0.12] text-[#424652] hover:text-[#121316] shadow-sm'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Big Play / Pause Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={
            isRunning
              ? 'Pause Timer'
              : secondsLeft === totalSeconds && !isFlow
                ? 'Start Focus'
                : 'Resume Timer'
          }
          onClick={() => {
            playLiquidWaveSound();
            onTogglePlay();
          }}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold shadow-md transition-all cursor-pointer ${
            isBreak
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              : 'bg-[#3762C4] hover:bg-[#2F59B8] shadow-[#3762C4]/25'
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

        {/* Flow Mode: Finish & Log Session Button */}
        {isFlow && secondsLeft > 0 && onFinishFlow && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Finish and log flow session"
            onClick={() => {
              playPenTapSound();
              onFinishFlow();
            }}
            title="Finish and log flow session"
            className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Finish Flow</span>
          </motion.button>
        )}

        {/* Skip / Next Interval (Hidden during flow mode if not running) */}
        {!isFlow && (
          <button
            type="button"
            onClick={() => {
              playPenTapSound();
              onSkip();
            }}
            title={isBreak ? 'End Break early' : 'Skip to Break'}
            aria-label={isBreak ? 'End Break early' : 'Skip to Break'}
            className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
              isZenMode
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-[#FAF9F6]'
                : 'bg-white hover:bg-[#EAF0FC] border-[#121316]/[0.12] text-[#424652] hover:text-[#121316] shadow-sm'
            }`}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}

        {/* Zen Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleZen}
          title={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Fullscreen Focus'}
          aria-label={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Fullscreen Focus'}
          className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
            isZenMode
              ? 'bg-white/10 hover:bg-white/20 border-white/15 text-[#FAF9F6]'
              : 'bg-white hover:bg-[#EAF0FC] border-[#121316]/[0.12] text-[#424652] hover:text-[#2F59B8] shadow-sm'
          }`}
        >
          {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
