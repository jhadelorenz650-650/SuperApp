import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getDayDiff,
  getDeadlineProgress,
  getGreetingByTime,
  isTaskDueToday,
  isTaskOverdue,
  parseLocalDate,
  toDateInputString,
} from './taskDates.js';

describe('Task Dates - Parsing and Formatting', () => {
  it('parses local date string into midnight Date', () => {
    const parsed = parseLocalDate('2026-11-10');
    assert.ok(parsed instanceof Date);
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 10); // Nov is 10
    assert.equal(parsed.getDate(), 10);
  });

  it('formats Date into YYYY-MM-DD input string', () => {
    const d = new Date(2026, 10, 5);
    assert.equal(toDateInputString(d), '2026-11-05');
  });

  it('handles invalid date strings gracefully', () => {
    assert.equal(parseLocalDate(''), null);
    assert.equal(parseLocalDate(null), null);
    assert.equal(parseLocalDate('invalid'), null);
  });
});

describe('Task Dates - Day Difference and Due Checks', () => {
  it('calculates day difference accurately', () => {
    const now = new Date(2026, 10, 10, 12, 0); // Nov 10 noon

    assert.equal(getDayDiff('2026-11-10', now), 0);
    assert.equal(getDayDiff('2026-11-11', now), 1);
    assert.equal(getDayDiff('2026-11-15', now), 5);
    assert.equal(getDayDiff('2026-11-09', now), -1);
    assert.equal(getDayDiff('2026-11-05', now), -5);
  });

  it('identifies tasks due today', () => {
    const now = new Date(2026, 10, 10, 8, 0);

    assert.equal(isTaskDueToday({ dueDate: '2026-11-10', completed: false }, now), true);
    assert.equal(isTaskDueToday({ dueDate: '2026-11-11', completed: false }, now), false);
    assert.equal(isTaskDueToday({ dueDate: '2026-11-10', completed: true }, now), false);
  });

  it('identifies overdue tasks', () => {
    const now = new Date(2026, 10, 10, 8, 0);

    assert.equal(isTaskOverdue({ dueDate: '2026-11-09', completed: false }, now), true);
    assert.equal(isTaskOverdue({ dueDate: '2026-11-10', completed: false }, now), false);
    assert.equal(isTaskOverdue({ dueDate: '2026-11-08', completed: true }, now), false);
  });
});

describe('Task Dates - Countdown and Progress', () => {
  it('formats deadline countdown for completed, overdue, and upcoming tasks', () => {
    const now = new Date(2026, 10, 10, 12, 0);

    const completed = formatDeadlineCountdown('2026-11-10', true, now);
    assert.equal(completed.status, 'completed');

    const overdue = formatDeadlineCountdown('2026-11-08', false, now);
    assert.equal(overdue.status, 'overdue');
    assert.equal(overdue.label, 'Overdue');

    const dueToday = formatDeadlineCountdown('2026-11-10', false, now);
    assert.equal(dueToday.status, 'today');
    assert.ok(dueToday.label.includes('Due today'));

    const tomorrow = formatDeadlineCountdown('2026-11-11', false, now);
    assert.equal(tomorrow.status, 'soon');
    assert.equal(tomorrow.label, '1 day left');

    const daysLeft = formatDeadlineCountdown('2026-11-14', false, now);
    assert.equal(daysLeft.label, '4 days left');
  });

  it('calculates deadline progress correctly', () => {
    const now = new Date(2026, 10, 10, 12, 0);

    const doneTask = { dueDate: '2026-11-10', completed: true };
    assert.equal(getDeadlineProgress(doneTask, now).percent, 100);

    const overdueTask = { dueDate: '2026-11-09', completed: false };
    assert.equal(getDeadlineProgress(overdueTask, now).status, 'overdue');
  });
});

describe('Task Dates - Greetings', () => {
  it('returns appropriate greetings for time of day', () => {
    assert.equal(getGreetingByTime(new Date(2026, 10, 10, 8, 0)), 'Good morning');
    assert.equal(getGreetingByTime(new Date(2026, 10, 10, 14, 0)), 'Good afternoon');
    assert.equal(getGreetingByTime(new Date(2026, 10, 10, 19, 0)), 'Good evening');
  });
});
