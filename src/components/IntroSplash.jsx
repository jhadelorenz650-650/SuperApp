import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CheckSquare,
  NotebookPen,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  playIntroOpeningSound,
  playLiquidWaveSound,
} from '../utils/soundEffects';

const CONVERGE_MODULES = [
  {
    icon: CheckSquare,
    x: -110,
    y: -90,
    bg: 'bg-[#4E51BF]',
    fg: 'text-white',
    delay: 0.04,
  },
  {
    icon: CalendarDays,
    x: 110,
    y: -90,
    bg: 'bg-[#FFE9CE]',
    fg: 'text-[#24252A]',
    delay: 0.08,
  },
  {
    icon: NotebookPen,
    x: -110,
    y: 90,
    bg: 'bg-[#FF92A4]',
    fg: 'text-white',
    delay: 0.12,
  },
  {
    icon: Timer,
    x: 110,
    y: 90,
    bg: 'bg-[#24252A]',
    fg: 'text-[#FFE9CE]',
    delay: 0.16,
  },
];

const POP_BURST_PARTICLES = [
  { angle: 0, dist: 115, size: 10, color: '#4E51BF', shape: 'circle' },
  { angle: 20, dist: 145, size: 8, color: '#FF92A4', shape: 'diamond' },
  { angle: 40, dist: 105, size: 11, color: '#F59E0B', shape: 'pill' },
  { angle: 60, dist: 150, size: 9, color: '#4E51BF', shape: 'circle' },
  { angle: 82, dist: 120, size: 8, color: '#24252A', shape: 'diamond' },
  { angle: 104, dist: 140, size: 10, color: '#FF92A4', shape: 'pill' },
  { angle: 126, dist: 112, size: 9, color: '#10B981', shape: 'circle' },
  { angle: 148, dist: 148, size: 8, color: '#4E51BF', shape: 'diamond' },
  { angle: 170, dist: 118, size: 11, color: '#FF92A4', shape: 'circle' },
  { angle: 192, dist: 142, size: 8, color: '#F59E0B', shape: 'pill' },
  { angle: 214, dist: 108, size: 9, color: '#24252A', shape: 'diamond' },
  { angle: 236, dist: 152, size: 10, color: '#4E51BF', shape: 'circle' },
  { angle: 258, dist: 116, size: 8, color: '#FF92A4', shape: 'diamond' },
  { angle: 280, dist: 144, size: 10, color: '#10B981', shape: 'pill' },
  { angle: 302, dist: 110, size: 9, color: '#4E51BF', shape: 'circle' },
  { angle: 324, dist: 148, size: 8, color: '#FF92A4', shape: 'diamond' },
  { angle: 344, dist: 114, size: 9, color: '#F59E0B', shape: 'circle' },
];

// Build identical-command 3-crest SVG paths so Framer Motion morphs smoothly
function buildCrestPath([y0, y1, y2, y3], c = 90) {
  return `M 0,${y0} C 160,${y0 - c} 320,${y1 + c} 480,${y1} C 640,${y1 - c} 800,${y2 + c} 960,${y2} C 1120,${y2 - c} 1280,${y3 + c} 1440,${y3}`;
}

function buildRibbonPath(topYs, botYs, topC = 90, botC = 85) {
  const [b0, b1, b2, b3] = botYs;
  return `${buildCrestPath(topYs, topC)} L 1440,${b3} C 1280,${b3 + botC} 1120,${b2 - botC} 960,${b2} C 800,${b2 + botC} 640,${b1 - botC} 480,${b1} C 320,${b1 + botC} 160,${b0 - botC} 0,${b0} Z`;
}

const LIQUID_WAVES = [
  {
    id: 'wave-peach',
    fill: 'url(#grad-peach)',
    crestStroke: null,
    delay: 0,
    duration: 0.92,
    driftX: ['0%', '-4%'],
    paths: [
      buildRibbonPath([180, 110, 210, 120], [870, 920, 820, 900], 85, 75),
      buildRibbonPath([110, 220, 100, 190], [910, 810, 920, 840], -80, -70),
      buildRibbonPath([190, 120, 200, 130], [860, 910, 830, 890], 70, 80),
    ],
    crests: null,
  },
  {
    id: 'wave-coral',
    fill: 'url(#grad-coral)',
    crestStroke: '#FFF4E6',
    delay: 0.08,
    duration: 0.96,
    driftX: ['-3%', '1%'],
    paths: [
      buildRibbonPath([160, 240, 120, 200], [840, 770, 880, 810], -95, -75),
      buildRibbonPath([230, 110, 230, 130], [780, 890, 790, 870], 95, 80),
      buildRibbonPath([150, 220, 130, 190], [850, 780, 870, 820], -80, -70),
    ],
    crests: [
      buildCrestPath([160, 240, 120, 200], -95),
      buildCrestPath([230, 110, 230, 130], 95),
      buildCrestPath([150, 220, 130, 190], -80),
    ],
  },
  {
    id: 'wave-indigo',
    fill: 'url(#grad-indigo)',
    crestStroke: '#FFE9CE',
    innerHighlight: [
      buildRibbonPath([260, 320, 220, 290], [340, 410, 300, 370], -75, -70),
      buildRibbonPath([310, 210, 310, 230], [390, 300, 390, 320], 75, 70),
      buildRibbonPath([250, 300, 230, 280], [330, 390, 310, 360], -65, -60),
    ],
    delay: 0.15,
    duration: 1.02,
    driftX: ['0%', '-5%'],
    paths: [
      buildRibbonPath([190, 110, 230, 130], [790, 870, 770, 850], 105, 85),
      buildRibbonPath([120, 240, 110, 210], [870, 760, 880, 790], -100, -80),
      buildRibbonPath([200, 130, 210, 140], [800, 860, 780, 840], 90, 75),
    ],
    crests: [
      buildCrestPath([190, 110, 230, 130], 105),
      buildCrestPath([120, 240, 110, 210], -100),
      buildCrestPath([200, 130, 210, 140], 90),
    ],
  },
  {
    id: 'wave-ink-crest',
    fill: '#24252A',
    crestStroke: '#FF92A4',
    delay: 0.23,
    duration: 0.98,
    driftX: ['-4%', '0%'],
    paths: [
      buildRibbonPath([220, 160, 250, 175], [380, 460, 360, 430], 75, 65),
      buildRibbonPath([160, 260, 150, 235], [440, 350, 450, 380], -75, -65),
      buildRibbonPath([215, 170, 240, 180], [390, 450, 370, 420], 65, 60),
    ],
    crests: [
      buildCrestPath([220, 160, 250, 175], 75),
      buildCrestPath([160, 260, 150, 235], -75),
      buildCrestPath([215, 170, 240, 180], 65),
    ],
  },
];

const LIQUID_DROPLETS = [
  { left: '8%', size: 18, color: '#FFE9CE', delay: 0.05, dur: 0.95, sway: 24 },
  { left: '16%', size: 10, color: '#FF92A4', delay: 0.14, dur: 0.88, sway: -18 },
  { left: '24%', size: 22, color: '#4E51BF', delay: 0.1, dur: 1.0, sway: 28 },
  { left: '33%', size: 12, color: '#FFFFFF', delay: 0.2, dur: 0.9, sway: -22 },
  { left: '41%', size: 16, color: '#FF92A4', delay: 0.08, dur: 0.96, sway: 16 },
  { left: '49%', size: 9, color: '#24252A', delay: 0.24, dur: 0.86, sway: -14 },
  { left: '56%', size: 20, color: '#FFE9CE', delay: 0.12, dur: 0.98, sway: 26 },
  { left: '64%', size: 11, color: '#4E51BF', delay: 0.19, dur: 0.92, sway: -24 },
  { left: '72%', size: 17, color: '#FF92A4', delay: 0.07, dur: 0.95, sway: 20 },
  { left: '80%', size: 13, color: '#FFFFFF', delay: 0.22, dur: 0.89, sway: -16 },
  { left: '88%', size: 19, color: '#4E51BF', delay: 0.15, dur: 0.99, sway: 22 },
  { left: '93%', size: 10, color: '#FFE9CE', delay: 0.11, dur: 0.91, sway: -20 },
];

// Preserved default opening animation (revert by passing variant="default")
export function DefaultIntroSplash({ show, onDismiss }) {
  const openingSoundStopRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;
    openingSoundStopRef.current = playIntroOpeningSound({ variant: 'default' });
    return () => {
      if (openingSoundStopRef.current) {
        openingSoundStopRef.current();
        openingSoundStopRef.current = null;
      }
    };
  }, [show]);

  const handleDismiss = () => {
    if (openingSoundStopRef.current) {
      openingSoundStopRef.current();
      openingSoundStopRef.current = null;
    }
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="default-intro-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-[#F1F2F9]/95 backdrop-blur-2xl select-none cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.45, opacity: 0 }}
            animate={{ scale: [0.45, 1.25, 1.08], opacity: [0, 0.9, 0.7] }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#FFE9CE] via-[#FF92A4]/35 to-[#4E51BF]/30 blur-3xl"
          />

          <div className="relative flex items-center justify-center mb-6">
            <motion.span
              initial={{ scale: 0.75, opacity: 0.85 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="absolute inset-0 rounded-2xl border border-[#4E51BF]/40"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -14 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-16 h-16 rounded-2xl bg-[#4E51BF] flex items-center justify-center shadow-lg shadow-[#4E51BF]/25"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          <div className="relative text-center max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#24252A]"
            >
              Hello, <span className="text-[#4E51BF]">Jhade</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm sm:text-base text-[#5C6070] mt-2 font-medium"
            >
              Welcome. Ready to crush today?
            </motion.p>
          </div>

          <div className="mt-7 w-40 h-[3px] rounded-full bg-[#24252A]/10 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full bg-gradient-to-r from-[#4E51BF] via-[#FF92A4] to-[#FFE9CE]"
            />
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-4 text-[11px] text-[#8A8F9E]"
          >
            Tap anywhere to continue
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Custom Super App kinetic shake + pop burst + morphing liquid wave transition
export function SuperAppIntroSplash({ show, onRevealStart, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [clickOrigin, setClickOrigin] = useState(null);
  const exitingRef = useRef(false);
  const timersRef = useRef([]);
  const openingSoundStopRef = useRef(null);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!show) return undefined;
    openingSoundStopRef.current = playIntroOpeningSound({ variant: 'superapp' });
    return () => {
      if (openingSoundStopRef.current) {
        openingSoundStopRef.current();
        openingSoundStopRef.current = null;
      }
    };
  }, [show]);

  const triggerLiquidTransition = (event) => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    const x =
      event?.clientX ??
      (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const y =
      event?.clientY ??
      (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
    setClickOrigin({ x, y });
    setIsExiting(true);

    if (openingSoundStopRef.current) {
      openingSoundStopRef.current();
      openingSoundStopRef.current = null;
    }
    playLiquidWaveSound();

    const revealTimer = setTimeout(() => {
      if (onRevealStart) onRevealStart();
    }, 440);

    const doneTimer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 1220);

    timersRef.current.push(revealTimer, doneTimer);
  };

  useEffect(() => {
    if (!show) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerLiquidTransition();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none ${
        isExiting ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      onClick={triggerLiquidTransition}
      role="button"
      tabIndex={0}
      aria-label="Click anywhere to continue into Pulse"
    >
      {/* Splash Backdrop + Content Layer */}
      <motion.div
        animate={
          isExiting
            ? { opacity: 0, scale: 0.94 }
            : { opacity: 1, scale: 1 }
        }
        transition={{
          duration: 0.4,
          delay: isExiting ? 0.2 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-[#F1F2F9]/96 backdrop-blur-2xl"
      >
        {/* Ambient Pastel Stage */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{
            scale: [0.4, 1.3, 1.15],
            opacity: [0, 0.9, 0.75],
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#FFE9CE] via-[#FF92A4]/35 to-[#4E51BF]/30 blur-3xl"
        />

        {/* Central Super App Emblem Stage */}
        <div className="relative flex items-center justify-center w-36 h-36 mb-4">
          {CONVERGE_MODULES.map(({ icon: Icon, x, y, bg, fg, delay }, idx) => (
            <motion.div
              key={idx}
              initial={{ x, y, scale: 0.9, opacity: 0, rotate: idx % 2 === 0 ? -25 : 25 }}
              animate={{
                x: [x, x * 0.25, 0],
                y: [y, y * 0.25, 0],
                scale: [0.85, 1.05, 0.2],
                opacity: [0, 1, 0],
                rotate: 0,
              }}
              transition={{
                duration: 0.5,
                delay,
                times: [0, 0.55, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`absolute w-10 h-10 rounded-xl ${bg} ${fg} flex items-center justify-center shadow-md`}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          ))}

          {/* Expanding Pop-Burst Shockwave Rings */}
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 3.2], opacity: [0, 0.9, 0] }}
            transition={{ delay: 0.84, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute w-20 h-20 rounded-full border-2 border-[#4E51BF]"
          />
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 2.5], opacity: [0, 0.85, 0] }}
            transition={{ delay: 0.9, duration: 0.65, ease: 'easeOut' }}
            className="pointer-events-none absolute w-20 h-20 rounded-full border-2 border-[#FF92A4]"
          />

          {/* Pop Burst Particles */}
          {POP_BURST_PARTICLES.map((p, idx) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.dist;
            const ty = Math.sin(rad) * p.dist;
            const shapeClass =
              p.shape === 'diamond' ? 'rounded-[2px] rotate-45' : 'rounded-full';

            return (
              <motion.span
                key={idx}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: [0, tx],
                  y: [0, ty],
                  scale: [0, 1.3, 0],
                  opacity: [0, 1, 0],
                  rotate: p.shape === 'circle' ? 0 : 180,
                }}
                transition={{
                  delay: 0.84,
                  duration: 0.78,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  width: p.shape === 'pill' ? p.size + 6 : p.size,
                  height: p.shape === 'pill' ? Math.max(4, p.size - 4) : p.size,
                  backgroundColor: p.color,
                }}
                className={`pointer-events-none absolute ${shapeClass}`}
              />
            );
          })}

          {/* Custom Super App Vector Graphic Emblem */}
          <motion.div
            initial={{ scale: 0.25, opacity: 0 }}
            animate={{
              scale: [0.25, 1, 1.04, 0.96, 1.07, 0.97, 1.32, 0.95, 1],
              x: [0, 0, -7, 7, -6, 6, -3, 0, 0],
              rotate: [0, 0, -6, 6, -5, 5, 0, 0, 0],
              opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1],
            }}
            transition={{
              duration: 1.15,
              delay: 0.22,
              times: [0, 0.22, 0.32, 0.4, 0.48, 0.56, 0.68, 0.84, 1],
              ease: 'easeInOut',
            }}
            className="relative w-20 h-20 rounded-[1.5rem] bg-[#4E51BF] p-[3px] shadow-xl shadow-[#4E51BF]/25 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-[1.35rem] bg-gradient-to-br from-[#4E51BF] via-[#5F62CF] to-[#24252A] flex items-center justify-center relative overflow-hidden">
              <span className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[#FFE9CE]/90" />
              <span className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-[#FF92A4]/85" />
              <svg
                viewBox="0 0 48 48"
                className="relative z-10 w-10 h-10"
                fill="none"
                aria-hidden="true"
              >
                <rect x="7" y="7" width="14" height="14" rx="4.5" fill="#FFE9CE" />
                <rect x="27" y="7" width="14" height="14" rx="7" fill="#FF92A4" />
                <rect
                  x="7"
                  y="27"
                  width="14"
                  height="14"
                  rx="7"
                  fill="#FFFFFF"
                  fillOpacity="0.92"
                />
                <path
                  d="M28 34l4.5 4.5L41 29.5"
                  stroke="#FFE9CE"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Personalized Pop Reveal */}
        <div className="relative text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 12 }}
            animate={{ opacity: 1, scale: [0.75, 1.07, 1], y: 0 }}
            transition={{
              delay: 0.88,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE9CE] border border-[#F2CFA4]/80 text-[11px] font-semibold text-[#24252A] mb-3">
              <Sparkles className="w-3 h-3 text-[#4E51BF]" />
              Pulse Super App
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#24252A]">
              Hello, <span className="text-[#4E51BF]">Jhade</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base text-[#5C6070] mt-2 font-medium"
          >
            Welcome. Ready to crush today?
          </motion.p>
        </div>

        {/* Animated Progress Bar */}
        <div className="mt-6 w-44 h-[3px] rounded-full bg-[#24252A]/10 overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ delay: 0.25, duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full bg-gradient-to-r from-[#4E51BF] via-[#FF92A4] to-[#FFE9CE]"
          />
        </div>

        {/* Interactive Click-to-Continue Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.4 }}
          className="mt-6"
        >
          <motion.span
            animate={{ opacity: [0.65, 1, 0.65], y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 border border-[#24252A]/[0.08] text-xs font-medium text-[#24252A] shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4E51BF]" />
            Click anywhere to continue
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Rich Morphing Liquid Wave + Splash Ripple Exit Transition */}
      {isExiting && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Click-Origin Water Drop Ripple */}
          {clickOrigin && (
            <div
              style={{ left: clickOrigin.x, top: clickOrigin.y }}
              className="fixed -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <motion.span
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 6, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="block w-14 h-14 rounded-full border-2 border-[#4E51BF]"
              />
              <motion.span
                initial={{ scale: 0.2, opacity: 0.8 }}
                animate={{ scale: 4.2, opacity: 0 }}
                transition={{ duration: 0.48, delay: 0.06, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-[#FF92A4]"
              />
            </div>
          )}

          {/* Morphing Multi-Gradient Wave Ribbons */}
          {LIQUID_WAVES.map((wave) => (
            <motion.svg
              key={wave.id}
              viewBox="0 0 1440 900"
              preserveAspectRatio="none"
              initial={{ y: '105%', x: wave.driftX[0] }}
              animate={{ y: '-128%', x: wave.driftX[1] }}
              transition={{
                duration: wave.duration,
                delay: wave.delay,
                ease: [0.42, 0, 0.18, 1],
              }}
              className="absolute left-0 top-0 w-[108%] h-[148dvh]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`grad-peach-${wave.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE9CE" />
                  <stop offset="100%" stopColor="#FCD8AA" />
                </linearGradient>
                <linearGradient id={`grad-coral-${wave.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF92A4" />
                  <stop offset="100%" stopColor="#FFB0BE" />
                </linearGradient>
                <linearGradient id={`grad-indigo-${wave.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4E51BF" />
                  <stop offset="55%" stopColor="#6366D1" />
                  <stop offset="100%" stopColor="#3B3E9E" />
                </linearGradient>
              </defs>

              <motion.path
                d={wave.paths[0]}
                animate={{ d: wave.paths }}
                transition={{
                  duration: wave.duration,
                  delay: wave.delay,
                  ease: 'easeInOut',
                }}
                fill={
                  wave.fill.startsWith('url(#')
                    ? `url(#${wave.fill.slice(5, -1)}-${wave.id})`
                    : wave.fill
                }
              />

              {wave.innerHighlight && (
                <motion.path
                  d={wave.innerHighlight[0]}
                  animate={{ d: wave.innerHighlight }}
                  transition={{
                    duration: wave.duration,
                    delay: wave.delay,
                    ease: 'easeInOut',
                  }}
                  fill="rgba(255, 255, 255, 0.14)"
                />
              )}

              {wave.crests && wave.crestStroke && (
                <motion.path
                  d={wave.crests[0]}
                  animate={{ d: wave.crests }}
                  transition={{
                    duration: wave.duration,
                    delay: wave.delay,
                    ease: 'easeInOut',
                  }}
                  fill="none"
                  stroke={wave.crestStroke}
                  strokeWidth="5"
                  strokeOpacity="0.72"
                  strokeLinecap="round"
                />
              )}
            </motion.svg>
          ))}

          {/* Floating Liquid Splash Droplets Rising with the Wave Crest */}
          {LIQUID_DROPLETS.map((drop, idx) => (
            <motion.span
              key={idx}
              initial={{
                bottom: '-6%',
                x: 0,
                scaleX: 1,
                scaleY: 1.25,
                opacity: 0,
              }}
              animate={{
                bottom: '112%',
                x: [0, drop.sway, -drop.sway * 0.45],
                scaleX: [1.05, 0.85, 1],
                scaleY: [1.3, 1.15, 0.9],
                opacity: [0, 0.95, 0.9, 0],
              }}
              transition={{
                duration: drop.dur,
                delay: drop.delay,
                ease: [0.35, 0, 0.2, 1],
              }}
              style={{
                left: drop.left,
                width: drop.size,
                height: drop.size,
                backgroundColor: drop.color,
              }}
              className="absolute rounded-full shadow-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function IntroSplash({
  show,
  onRevealStart,
  onDismiss,
  variant = 'superapp',
}) {
  if (variant === 'default') {
    return <DefaultIntroSplash show={show} onDismiss={onDismiss} />;
  }
  return (
    <SuperAppIntroSplash
      show={show}
      onRevealStart={onRevealStart}
      onDismiss={onDismiss}
    />
  );
}
