// Focus system presets, breathing exercises, and time calculations

export const FOCUS_MODES = [
  {
    key: 'pomodoro',
    label: '25m Pomodoro',
    shortLabel: '25m',
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    intervalsBeforeLongBreak: 4,
    description: 'Classic interval for sustained energy & sharp attention',
    icon: 'Timer',
  },
  {
    key: 'deep_work',
    label: '50m Deep Block',
    shortLabel: '50m',
    workMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    intervalsBeforeLongBreak: 2,
    description: 'Standard college lecture & intensive problem-solving cycle',
    icon: 'Sparkles',
  },
  {
    key: 'ultradian',
    label: '90m Ultradian',
    shortLabel: '90m',
    workMinutes: 90,
    shortBreakMinutes: 20,
    longBreakMinutes: 30,
    intervalsBeforeLongBreak: 2,
    description: 'Peak biological cognitive cycle for papers, essays & coding',
    icon: 'Flame',
  },
  {
    key: 'flow',
    label: 'Open Flowstate',
    shortLabel: 'Flow',
    workMinutes: 0, // Stopwatch count-up mode
    shortBreakMinutes: 10,
    longBreakMinutes: 15,
    intervalsBeforeLongBreak: 1,
    description: 'Uncapped stopwatch for when you are completely in the zone',
    icon: 'Infinity',
  },
];

export const BREAK_ACTIVITIES = [
  {
    key: 'breath',
    title: '4-7-8 Breathwork',
    instruction: 'Inhale through nose for 4s, hold for 7s, exhale slowly for 8s to reset nervous system.',
    tag: 'Mental Reset',
  },
  {
    key: 'hydrate',
    title: 'Hydration Check',
    instruction: 'Drink a glass of cold water to rehydrate your brain cells and improve cognitive stamina.',
    tag: 'Physical',
  },
  {
    key: 'eyes',
    title: '20-20-20 Eye Rest',
    instruction: 'Look at an object at least 20 feet away for 20 seconds to alleviate digital screen fatigue.',
    tag: 'Eye Care',
  },
  {
    key: 'stretch',
    title: 'Stand & Shoulder Roll',
    instruction: 'Stand up, roll shoulders backward 5 times, and stretch your spine to release tension.',
    tag: 'Posture',
  },
];

// Format date into local YYYY-MM-DD
export function getLocalDateKey(dateInput) {
  if (!dateInput || typeof dateInput === 'boolean') return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate streak from previous logs
export function calculateStudyStreak(history = [], now = new Date()) {
  if (!history || !Array.isArray(history) || history.length === 0) return 0;

  const referenceDate =
    now instanceof Date && !Number.isNaN(now.getTime())
      ? now
      : typeof now === 'number' || typeof now === 'string'
        ? new Date(now)
        : new Date();

  if (Number.isNaN(referenceDate.getTime())) return 0;

  const dateSet = new Set();
  history.forEach((item) => {
    if (item && item.completedAt) {
      const key = getLocalDateKey(item.completedAt);
      if (key) dateSet.add(key);
    }
  });

  const todayStr = getLocalDateKey(referenceDate);
  // Use noon to avoid any midnight daylight saving time (DST) shifts
  const yesterday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1,
    12,
    0,
    0
  );
  const yesterdayStr = getLocalDateKey(yesterday);

  // If didn't study today or yesterday, streak is broken
  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  const checkDate = dateSet.has(todayStr)
    ? new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        12,
        0,
        0
      )
    : new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - 1,
        12,
        0,
        0
      );

  while (true) {
    const curStr = getLocalDateKey(checkDate);
    if (dateSet.has(curStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Format seconds into MM:SS or HH:MM:SS
export function formatTimerDigits(totalSeconds) {
  const num = typeof totalSeconds === 'number' ? totalSeconds : Number(totalSeconds);
  if (!Number.isFinite(num) || num <= 0) return '00:00';
  const s = Math.floor(num);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

