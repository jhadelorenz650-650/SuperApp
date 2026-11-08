export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function toDateInputString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDayDiff(dueDateStr, now = new Date()) {
  const due = parseLocalDate(dueDateStr);
  if (!due) return null;
  const todayStart = getStartOfDay(now);
  const dueStart = getStartOfDay(due);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueStart.getTime() - todayStart.getTime()) / msPerDay);
}

export function isTaskOverdue(task, now = new Date()) {
  if (!task || task.completed || !task.dueDate) return false;
  const diff = getDayDiff(task.dueDate, now);
  return diff !== null && diff < 0;
}

export function isTaskDueToday(task, now = new Date()) {
  if (!task || task.completed || !task.dueDate) return false;
  const diff = getDayDiff(task.dueDate, now);
  return diff === 0;
}

export function formatDeadlineCountdown(dueDateStr, completed = false, now = new Date()) {
  const diff = getDayDiff(dueDateStr, now);
  if (diff === null) {
    return { label: 'No due date', status: 'neutral' };
  }

  if (completed) {
    return { label: 'Completed', status: 'completed' };
  }

  if (diff < 0) {
    return { label: 'Overdue', status: 'overdue' };
  }

  if (diff === 0) {
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const msLeft = Math.max(0, endOfToday.getTime() - now.getTime());
    const totalMinutes = Math.floor(msLeft / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      const seconds = Math.floor((msLeft % 60000) / 1000);
      return {
        label: `Due today · ${minutes}m ${seconds}s`,
        status: 'today',
      };
    }

    return {
      label: `Due today · ${hours}h ${minutes}m`,
      status: 'today',
    };
  }

  if (diff === 1) {
    return { label: '1 day left', status: 'soon' };
  }

  return { label: `${diff} days left`, status: diff <= 2 ? 'soon' : 'upcoming' };
}

export function getDeadlineProgress(task, now = new Date()) {
  if (!task) return { percent: 0, status: 'neutral' };
  if (task.completed) return { percent: 100, status: 'completed' };

  const due = parseLocalDate(task.dueDate);
  if (!due) return { percent: 0, status: 'neutral' };

  const diff = getDayDiff(task.dueDate, now);
  if (diff !== null && diff < 0) {
    return { percent: 100, status: 'overdue' };
  }

  const dueEnd = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
    23,
    59,
    59
  ).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const createdMs = task.createdAt || now.getTime();
  const windowStart = Math.min(createdMs, dueEnd - sevenDaysMs);
  const totalSpan = Math.max(60 * 60 * 1000, dueEnd - windowStart);
  const elapsed = Math.max(0, now.getTime() - windowStart);
  const raw = Math.round((elapsed / totalSpan) * 100);
  const percent = Math.max(10, Math.min(100, raw));

  const status = diff === 0 ? 'today' : diff <= 2 ? 'soon' : 'upcoming';
  return { percent, status };
}

export function formatShortDate(dateStr) {
  const date = parseLocalDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function getGreetingByTime(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTodayHeader(now = new Date()) {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getTodayInputString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toDateInputString(date);
}

export function getCompletedThisWeekCount(tasks, now = new Date()) {
  const todayStart = getStartOfDay(now);
  const dayOfWeek = (todayStart.getDay() + 6) % 7; // Monday = 0
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - dayOfWeek);
  const weekStartMs = weekStart.getTime();

  return tasks.filter((task) => {
    if (!task.completed) return false;
    const stamp = task.completedAt || task.createdAt || 0;
    return stamp >= weekStartMs;
  }).length;
}

export function getTaskStreak(tasks, now = new Date()) {
  const completedDayKeys = new Set(
    tasks
      .filter((t) => t.completed)
      .map((t) => toDateInputString(new Date(t.completedAt || t.createdAt || Date.now())))
  );

  if (completedDayKeys.size === 0) return 0;

  let cursor = getStartOfDay(now);
  if (!completedDayKeys.has(toDateInputString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!completedDayKeys.has(toDateInputString(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (completedDayKeys.has(toDateInputString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getWeeklyActivityData(tasks, now = new Date()) {
  const todayStart = getStartOfDay(now);
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const key = toDateInputString(d);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });

    const completed = tasks.filter((t) => {
      if (!t.completed) return false;
      const stamp = new Date(t.completedAt || t.createdAt || Date.now());
      return toDateInputString(stamp) === key;
    }).length;

    const added = tasks.filter((t) => {
      if (!t.createdAt) return false;
      return toDateInputString(new Date(t.createdAt)) === key;
    }).length;

    days.push({
      dateKey: key,
      day: label,
      completed,
      added,
      total: completed + added,
      isToday: i === 0,
    });
  }

  return days;
}

export function getMonthCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = (firstDay.getDay() + 6) % 7; // Monday first
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    const dateObj = new Date(year, month, day);
    cells.push({
      day,
      dateKey: toDateInputString(dateObj),
      date: dateObj,
    });
  }
  return cells;
}
