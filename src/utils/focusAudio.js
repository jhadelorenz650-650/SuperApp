// Procedural Web Audio API soundscape generator & timer chimes
// 100% offline, zero audio asset dependencies, infinite organic ambiance

let audioCtx = null;
let currentSoundType = 'none';
let currentNodes = null;
let currentVolume = 0.5;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getCurrentSoundType() {
  return currentSoundType;
}

export function getCurrentVolume() {
  return currentVolume;
}

// Generate organic white/pink/brown noise buffer
function createNoiseBuffer(ctx, seconds = 5, color = 'pink') {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  if (color === 'white') {
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (color === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }
  } else {
    // Pink noise (Paul Kellet's filtered method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

export const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Mute / Silence', icon: 'VolumeX' },
  { id: 'rain', label: 'Gentle Rain', icon: 'CloudRain', desc: 'Soothing rainfall on a dorm window' },
  { id: 'waves', label: 'Ocean Waves', icon: 'Waves', desc: 'Rhythmic rolling coastline tides' },
  { id: 'cafe', label: 'Campus Café', icon: 'Coffee', desc: 'Warm murmuring coffee shop hum' },
  { id: 'alpha', label: '10Hz Alpha Waves', icon: 'Activity', desc: 'Isochronic binaural tone for deep flow' },
  { id: 'white', label: 'Pure White Noise', icon: 'Wind', desc: 'Consistent masking static' },
];

export function stopAmbientSound() {
  if (currentNodes) {
    const nodesToStop = currentNodes;
    currentNodes = null;
    currentSoundType = 'none';

    try {
      if (nodesToStop.gainNode && audioCtx && audioCtx.state !== 'closed') {
        nodesToStop.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        nodesToStop.gainNode.gain.linearRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + 0.35
        );
      }
      setTimeout(() => {
        try {
          if (nodesToStop.sources) {
            nodesToStop.sources.forEach((s) => {
              try { s.stop && s.stop(); } catch {}
              try { s.disconnect && s.disconnect(); } catch {}
            });
          }
          if (nodesToStop.gainNode) {
            try { nodesToStop.gainNode.disconnect(); } catch {}
          }
        } catch {
          // Ignore
        }
      }, 400);
    } catch {
      // Ignore
    }
  } else {
    currentSoundType = 'none';
  }
}

export function setAmbientVolume(vol) {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (currentNodes && currentNodes.gainNode && audioCtx && audioCtx.state !== 'closed') {
    try {
      currentNodes.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      currentNodes.gainNode.gain.setValueAtTime(currentVolume * 0.25, audioCtx.currentTime);
    } catch {
      // Ignore
    }
  }
}

export function playAmbientSound(type, volume = 0.5) {
  if (type === 'none') {
    stopAmbientSound();
    return;
  }

  const ctx = getContext();
  if (!ctx) return;

  // If already playing this type, just adjust volume
  if (currentSoundType === type && currentNodes) {
    setAmbientVolume(volume);
    return;
  }

  // Stop previous sound
  stopAmbientSound();
  currentSoundType = type;
  currentVolume = volume;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.linearRampToValueAtTime(volume * 0.25, now + 1.2);
  masterGain.connect(ctx.destination);

  const sources = [];

  if (type === 'rain') {
    // Pink noise through low-pass & bandpass for rainfall
    const buffer = createNoiseBuffer(ctx, 4, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    source.connect(filter);
    filter.connect(masterGain);
    source.start(now);
    sources.push(source);

    // Subtle droplet pitter-patter
    const dropBuffer = createNoiseBuffer(ctx, 3, 'brown');
    const dropSource = ctx.createBufferSource();
    dropSource.buffer = dropBuffer;
    dropSource.loop = true;

    const dropFilter = ctx.createBiquadFilter();
    dropFilter.type = 'bandpass';
    dropFilter.frequency.setValueAtTime(1400, now);
    dropFilter.Q.setValueAtTime(3.0, now);

    dropSource.connect(dropFilter);
    dropFilter.connect(masterGain);
    dropSource.start(now);
    sources.push(dropSource);
  } else if (type === 'waves') {
    // Ocean surf: brown noise modulated by slow LFO sine
    const buffer = createNoiseBuffer(ctx, 6, 'brown');
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    // LFO modulator for wave roll in/out (approx 12-second cycle)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now); // 12.5s cycle

    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(0.12, now);
    lfo.connect(lfoDepth);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.16, now);
    lfoDepth.connect(waveGain.gain);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(masterGain);

    source.start(now);
    lfo.start(now);
    sources.push(source, lfo, lfoDepth, waveGain);
  } else if (type === 'cafe') {
    // Low brown ambient murmur with occasional muffled warmth
    const buffer = createNoiseBuffer(ctx, 5, 'brown');
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    source.connect(filter);
    filter.connect(masterGain);
    source.start(now);
    sources.push(source);
  } else if (type === 'alpha') {
    // 10Hz Binaural Alpha Flow: 216Hz + 226Hz sine waves
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(216, now);
    osc2.frequency.setValueAtTime(226, now); // 10Hz beat

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.08, now);

    osc1.connect(toneGain);
    osc2.connect(toneGain);
    toneGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    sources.push(osc1, osc2);
  } else {
    // Pure White / Masking noise
    const buffer = createNoiseBuffer(ctx, 4, 'white');
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    source.connect(filter);
    filter.connect(masterGain);
    source.start(now);
    sources.push(source);
  }

  currentNodes = {
    gainNode: masterGain,
    sources,
  };
}

// Gentle focus start chime (Rising C5 -> G5)
export function playFocusStartChime() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [523.25, 783.99].forEach((freq, i) => {
    const start = now + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

// Resonant Tibetan Singing Bowl chime upon finishing a focus session
export function playFocusCompleteGong() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Multi-harmonic bronze bell frequencies (fundamental + overtones)
  const harmonics = [
    { freq: 440, gain: 0.14, decay: 3.2 },
    { freq: 880, gain: 0.08, decay: 2.4 },
    { freq: 1320, gain: 0.04, decay: 1.8 },
    { freq: 1760, gain: 0.02, decay: 1.2 },
  ];

  harmonics.forEach(({ freq, gain: peakGain, decay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + decay + 0.05);
  });
}

// Playful marimba chime when rest break finishes
export function playBreakOverChime() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [587.33, 659.25, 880.0].forEach((freq, i) => {
    const start = now + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.065, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}
