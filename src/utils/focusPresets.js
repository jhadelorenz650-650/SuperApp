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

// Calculate streak from previous logs
export function calculateStudyStreak(history = []) {
  if (!history || history.length === 0) return 0;

  const dateSet = new Set();
  history.forEach((item) => {
    if (item.completedAt) {
      const d = new Date(item.completedAt).toISOString().slice(0, 10);
      dateSet.add(d);
    }
  });

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // If didn't study today or yesterday, streak is broken
  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date(dateSet.has(todayStr) ? today : yesterday);

  while (true) {
    const curStr = checkDate.toISOString().slice(0, 10);
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
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
