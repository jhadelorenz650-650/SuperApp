let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function unlockAudioContext() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

let unlockListenersAttached = false;

export function initAudioUnlock() {
  if (typeof window === 'undefined' || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const events = ['pointerdown', 'mousedown', 'touchstart', 'keydown'];
  const handleFirstGesture = () => {
    unlockAudioContext();
    events.forEach((evt) => {
      window.removeEventListener(evt, handleFirstGesture, { capture: true });
    });
  };

  events.forEach((evt) => {
    window.addEventListener(evt, handleFirstGesture, {
      once: true,
      capture: true,
      passive: true,
    });
  });
}

function resumeAndRun(fn) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => fn(ctx)).catch(() => {});
    } else {
      fn(ctx);
    }
  } catch {
    // Ignore audio errors in restricted environments
  }
}

export function playTaskDoneSound() {
  resumeAndRun((ctx) => {
    const now = ctx.currentTime;

    // Tactile bubble pop
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(360, now);
    popOsc.frequency.exponentialRampToValueAtTime(860, now + 0.055);
    popGain.gain.setValueAtTime(0.08, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.08);

    // Warm uplifting chime triad (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const start = now + 0.03 + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(i === 2 ? 0.055 : 0.07, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  });
}

export function playTaskDeleteSound() {
  resumeAndRun((ctx) => {
    const now = ctx.currentTime;

    // Gentle downward bubble release
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.13);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Soft filtered air puff
    const bufferSize = Math.floor(ctx.sampleRate * 0.11);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.1);
    filter.Q.value = 1.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  });
}

export function playPageTurnSound() {
  resumeAndRun((ctx) => {
    const now = ctx.currentTime;

    // Airy notebook page flip rustle
    const dur = 0.15;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680, now);
    filter.frequency.exponentialRampToValueAtTime(1900, now + 0.06);
    filter.frequency.exponentialRampToValueAtTime(920, now + dur);
    filter.Q.value = 1.25;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Subtle soft paper settle thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(190, now + 0.06);
    thud.frequency.exponentialRampToValueAtTime(95, now + 0.13);
    thudGain.gain.setValueAtTime(0.032, now + 0.06);
    thudGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.135);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now + 0.06);
    thud.stop(now + 0.14);
  });
}

export function playPenTapSound() {
  resumeAndRun((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  });
}

export function playLiquidWaveSound() {
  resumeAndRun((ctx) => {
    const now = ctx.currentTime;

    // Water droplet plink at tap origin
    const drop = ctx.createOscillator();
    const dropGain = ctx.createGain();
    drop.type = 'sine';
    drop.frequency.setValueAtTime(520, now);
    drop.frequency.exponentialRampToValueAtTime(1040, now + 0.045);
    drop.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    dropGain.gain.setValueAtTime(0.09, now);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    drop.connect(dropGain);
    dropGain.connect(ctx.destination);
    drop.start(now);
    drop.stop(now + 0.16);

    // Flowing liquid wave sweep (bandpass-filtered noise)
    const waveDur = 0.85;
    const bufferSize = Math.floor(ctx.sampleRate * waveDur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(1350, now + 0.36);
    filter.frequency.exponentialRampToValueAtTime(420, now + waveDur);
    filter.Q.value = 1.8;

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.001, now);
    waveGain.gain.linearRampToValueAtTime(0.085, now + 0.25);
    waveGain.gain.exponentialRampToValueAtTime(0.001, now + waveDur);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(ctx.destination);
    noise.start(now);

    // Warm ambient reveal chord
    [392.0, 493.88, 587.33, 739.99].forEach((freq, i) => {
      const start = now + 0.12 + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.032, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.68);
    });
  });
}

// Custom synchronized sound sequence for the Super App opening animation
export function playIntroOpeningSound({ variant = 'superapp' } = {}) {
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  let masterGain = null;
  let resumeTimeoutId = null;
  const activeNodes = [];

  const scheduleSequence = (ctx, offsetSec = 0) => {
    if (cancelled) return;
    const now = ctx.currentTime;
    const base = now - offsetSec;

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.15, now);

    if (typeof ctx.createDynamicsCompressor === 'function') {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, now);
      compressor.knee.setValueAtTime(12, now);
      compressor.ratio.setValueAtTime(4, now);
      compressor.attack.setValueAtTime(0.004, now);
      compressor.release.setValueAtTime(0.14, now);
      masterGain.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      masterGain.connect(ctx.destination);
    }

    const scheduleTone = ({
      at,
      duration,
      freqStart,
      freqEnd = freqStart,
      type = 'sine',
      attack = 0.012,
      peakGain = 0.08,
    }) => {
      const start = base + at;
      const end = start + duration;
      const safeStart = Math.max(now, start);
      if (end - safeStart < 0.015) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freqStart), safeStart);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, freqEnd),
          Math.max(safeStart + 0.005, end)
        );
      }

      const attackEnd = Math.min(end - 0.006, safeStart + attack);
      gain.gain.setValueAtTime(0.0001, safeStart);
      gain.gain.linearRampToValueAtTime(peakGain, attackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(safeStart);
      osc.stop(end + 0.02);
      activeNodes.push(osc);
    };

    const scheduleNoise = ({
      at,
      duration,
      freqStart,
      freqEnd = freqStart,
      filterType = 'bandpass',
      q = 1.6,
      peakGain = 0.06,
      shapeFn = (t) => Math.sin(t * Math.PI),
    }) => {
      const start = base + at;
      const end = start + duration;
      const safeStart = Math.max(now, start);
      if (end - safeStart < 0.02) return;

      const actualDur = end - safeStart;
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * actualDur));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        const progress = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * shapeFn(progress);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(40, freqStart), safeStart);
      if (freqEnd !== freqStart) {
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(40, freqEnd),
          safeStart + actualDur
        );
      }
      filter.Q.value = q;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, safeStart);
      gain.gain.linearRampToValueAtTime(
        peakGain,
        safeStart + Math.min(0.045, actualDur * 0.35)
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, safeStart + actualDur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(safeStart);
      noise.stop(safeStart + actualDur + 0.02);
      activeNodes.push(noise);
    };

    if (variant === 'default') {
      scheduleTone({
        at: 0.04,
        duration: 0.16,
        freqStart: 380,
        freqEnd: 780,
        type: 'sine',
        attack: 0.01,
        peakGain: 0.12,
      });
      [392.0, 493.88, 587.33, 739.99].forEach((freq, i) => {
        scheduleTone({
          at: 0.1 + i * 0.06,
          duration: 0.65,
          freqStart: freq,
          type: i === 3 ? 'triangle' : 'sine',
          attack: 0.02,
          peakGain: i === 3 ? 0.05 : 0.075,
        });
      });
      return;
    }

    // 1. Converging 4 App Modules (0.04s - 0.28s): buoyant rising G-pentatonic plucks + air pull
    [392.0, 440.0, 493.88, 587.33].forEach((freq, i) => {
      const t = 0.035 + i * 0.052;
      scheduleTone({
        at: t,
        duration: 0.14,
        freqStart: freq * 0.92,
        freqEnd: freq,
        type: 'sine',
        attack: 0.008,
        peakGain: 0.095,
      });
      scheduleTone({
        at: t,
        duration: 0.09,
        freqStart: freq * 2,
        type: 'triangle',
        attack: 0.006,
        peakGain: 0.035,
      });
    });

    scheduleNoise({
      at: 0.04,
      duration: 0.38,
      freqStart: 240,
      freqEnd: 820,
      q: 1.5,
      peakGain: 0.06,
    });

    // 2. Center Emblem Materialize Lock (0.26s)
    scheduleTone({
      at: 0.26,
      duration: 0.16,
      freqStart: 195,
      freqEnd: 92,
      type: 'sine',
      attack: 0.008,
      peakGain: 0.13,
    });
    scheduleTone({
      at: 0.26,
      duration: 0.065,
      freqStart: 784,
      freqEnd: 440,
      type: 'triangle',
      attack: 0.004,
      peakGain: 0.045,
    });

    // 3. Kinetic Shake Ticks & Pressurized Riser (0.50s - 0.83s)
    [
      { at: 0.58, f0: 340, f1: 250 },
      { at: 0.67, f0: 415, f1: 305 },
      { at: 0.76, f0: 500, f1: 370 },
    ].forEach(({ at, f0, f1 }) => {
      scheduleTone({
        at,
        duration: 0.06,
        freqStart: f0,
        freqEnd: f1,
        type: 'triangle',
        attack: 0.005,
        peakGain: 0.095,
      });
      scheduleTone({
        at,
        duration: 0.045,
        freqStart: f0 * 1.5,
        freqEnd: f1 * 1.3,
        type: 'sine',
        attack: 0.004,
        peakGain: 0.045,
      });
    });

    scheduleTone({
      at: 0.5,
      duration: 0.33,
      freqStart: 260,
      freqEnd: 659.25,
      type: 'sine',
      attack: 0.05,
      peakGain: 0.065,
    });
    scheduleNoise({
      at: 0.52,
      duration: 0.31,
      freqStart: 420,
      freqEnd: 1560,
      q: 2.0,
      peakGain: 0.065,
      shapeFn: (t) => Math.pow(t, 1.3),
    });

    // 4. Pop Burst Explosion + 17-Particle Confetti Sparkle (0.84s)
    scheduleTone({
      at: 0.84,
      duration: 0.045,
      freqStart: 230,
      freqEnd: 1120,
      type: 'sine',
      attack: 0.004,
      peakGain: 0.175,
    });
    scheduleTone({
      at: 0.875,
      duration: 0.085,
      freqStart: 1120,
      freqEnd: 360,
      type: 'sine',
      attack: 0.004,
      peakGain: 0.125,
    });
    scheduleTone({
      at: 0.84,
      duration: 0.13,
      freqStart: 175,
      freqEnd: 68,
      type: 'sine',
      attack: 0.004,
      peakGain: 0.135,
    });

    scheduleNoise({
      at: 0.84,
      duration: 0.16,
      freqStart: 2200,
      freqEnd: 4800,
      filterType: 'highpass',
      q: 0.9,
      peakGain: 0.06,
      shapeFn: (t) => 1 - t,
    });

    [1567.98, 1975.53, 2349.32, 1760.0, 2637.02].forEach((freq, i) => {
      scheduleTone({
        at: 0.855 + i * 0.034,
        duration: 0.16,
        freqStart: freq,
        type: 'sine',
        attack: 0.006,
        peakGain: 0.038,
      });
    });

    // 5. "Pulse Super App / Hello, Jhade" Harmonic Bloom (Gmaj9, 0.87s - 1.85s)
    [392.0, 493.88, 587.33, 739.99, 880.0, 1174.66].forEach((freq, i) => {
      const t = 0.87 + i * 0.048;
      scheduleTone({
        at: t,
        duration: 0.78,
        freqStart: freq,
        type: 'sine',
        attack: 0.03,
        peakGain: i < 2 ? 0.075 : 0.055,
      });
      if (i >= 3) {
        scheduleTone({
          at: t,
          duration: 0.62,
          freqStart: freq,
          type: 'triangle',
          attack: 0.025,
          peakGain: 0.025,
        });
      }
    });
  };

  try {
    const ctx = getAudioContext();
    if (ctx) {
      const startedAt = performance.now();
      if (ctx.state === 'running') {
        scheduleSequence(ctx, 0);
      } else if (ctx.state === 'suspended') {
        resumeTimeoutId = window.setTimeout(() => {
          cancelled = true;
        }, 350);

        ctx
          .resume()
          .then(() => {
            if (resumeTimeoutId !== null) {
              window.clearTimeout(resumeTimeoutId);
              resumeTimeoutId = null;
            }
            const elapsedSec = (performance.now() - startedAt) / 1000;
            if (!cancelled && ctx.state === 'running' && elapsedSec <= 0.35) {
              scheduleSequence(ctx, elapsedSec);
            }
          })
          .catch(() => {});
      }
    }
  } catch {
    // Ignore audio errors in restricted environments
  }

  let stopped = false;

  return () => {
    if (stopped) return;
    stopped = true;
    cancelled = true;
    if (resumeTimeoutId !== null) {
      window.clearTimeout(resumeTimeoutId);
      resumeTimeoutId = null;
    }
    if (masterGain && audioCtx) {
      try {
        const now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(
          Math.max(0.0001, masterGain.gain.value),
          now
        );
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        activeNodes.forEach((node) => {
          try {
            node.stop(now + 0.065);
          } catch {
            // Node already finished or unstarted
          }
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}
