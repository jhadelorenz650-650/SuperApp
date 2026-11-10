import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAK_ACTIVITIES,
  calculateStudyStreak,
  FOCUS_MODES,
  formatTimerDigits,
  getLocalDateKey,
} from './focusPresets.js';

describe('Focus Presets - Local Date Key Formatter', () => {
  it('formats Date instances and timestamps into local YYYY-MM-DD', () => {
    const d = new Date(2026, 10, 10); // Nov 10, 2026 local
    assert.equal(getLocalDateKey(d), '2026-11-10');

    const ts = d.getTime();
    assert.equal(getLocalDateKey(ts), '2026-11-10');
  });

  it('handles invalid or empty inputs safely', () => {
    assert.equal(getLocalDateKey(null), '');
    assert.equal(getLocalDateKey('invalid-date'), '');
    assert.equal(getLocalDateKey(undefined), '');
    assert.equal(getLocalDateKey(true), '');
    assert.equal(getLocalDateKey(false), '');
  });
});

describe('Focus Presets - Study Streak Calculation', () => {
  it('returns 0 for empty or invalid history', () => {
    assert.equal(calculateStudyStreak([]), 0);
    assert.equal(calculateStudyStreak(null), 0);
    assert.equal(calculateStudyStreak([], null), 0);
    assert.equal(calculateStudyStreak(null, null), 0);
  });

  it('calculates continuous streak ending today', () => {
    const mockNow = new Date(2026, 10, 10, 14, 0); // Nov 10, 2026 2:00 PM

    const history = [
      { completedAt: new Date(2026, 10, 10, 10, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 10, 9, 15, 0).getTime(), durationMin: 50 },
      { completedAt: new Date(2026, 10, 8, 16, 0).getTime(), durationMin: 25 },
    ];

    const streak = calculateStudyStreak(history, mockNow);
    assert.equal(streak, 3);
  });

  it('maintains streak if user studied yesterday but has not studied today yet', () => {
    const mockNow = new Date(2026, 10, 10, 9, 0); // Nov 10 morning

    const history = [
      { completedAt: new Date(2026, 10, 9, 18, 0).getTime(), durationMin: 50 },
      { completedAt: new Date(2026, 10, 8, 14, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 10, 7, 11, 0).getTime(), durationMin: 90 },
    ];

    const streak = calculateStudyStreak(history, mockNow);
    assert.equal(streak, 3);
  });

  it('breaks streak when there is a gap of 2 or more days', () => {
    const mockNow = new Date(2026, 10, 10, 14, 0);

    const history = [
      { completedAt: new Date(2026, 10, 7, 10, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 10, 6, 10, 0).getTime(), durationMin: 25 },
    ];

    const streak = calculateStudyStreak(history, mockNow);
    assert.equal(streak, 0);
  });

  it('collapses multiple sessions on the same day into one streak day', () => {
    const mockNow = new Date(2026, 10, 10, 20, 0);

    const history = [
      { completedAt: new Date(2026, 10, 10, 9, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 10, 10, 11, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 10, 10, 16, 0).getTime(), durationMin: 50 },
      { completedAt: new Date(2026, 10, 9, 14, 0).getTime(), durationMin: 25 },
    ];

    const streak = calculateStudyStreak(history, mockNow);
    assert.equal(streak, 2);
  });

  it('correctly bridges month boundaries', () => {
    const mockNow = new Date(2026, 10, 1, 12, 0); // Nov 1, 2026

    const history = [
      { completedAt: new Date(2026, 10, 1, 10, 0).getTime(), durationMin: 25 },
      { completedAt: new Date(2026, 9, 31, 15, 0).getTime(), durationMin: 25 }, // Oct 31, 2026
      { completedAt: new Date(2026, 9, 30, 14, 0).getTime(), durationMin: 50 }, // Oct 30, 2026
    ];

    const streak = calculateStudyStreak(history, mockNow);
    assert.equal(streak, 3);
  });
});

describe('Focus Presets - Timer Digits Formatting', () => {
  it('formats MM:SS correctly for durations under an hour', () => {
    assert.equal(formatTimerDigits(0), '00:00');
    assert.equal(formatTimerDigits(5), '00:05');
    assert.equal(formatTimerDigits(59), '00:59');
    assert.equal(formatTimerDigits(60), '01:00');
    assert.equal(formatTimerDigits(1500), '25:00');
    assert.equal(formatTimerDigits(3000), '50:00');
  });

  it('formats HH:MM:SS for durations of 1 hour or more', () => {
    assert.equal(formatTimerDigits(3600), '1:00:00');
    assert.equal(formatTimerDigits(3665), '1:01:05');
    assert.equal(formatTimerDigits(7325), '2:02:05');
  });

  it('handles negative, null, undefined, or NaN gracefully', () => {
    assert.equal(formatTimerDigits(-10), '00:00');
    assert.equal(formatTimerDigits(null), '00:00');
    assert.equal(formatTimerDigits(undefined), '00:00');
    assert.equal(formatTimerDigits(NaN), '00:00');
    assert.equal(formatTimerDigits(Infinity), '00:00');
    assert.equal(formatTimerDigits(-Infinity), '00:00');
    assert.equal(formatTimerDigits('abc'), '00:00');
    assert.equal(formatTimerDigits({}), '00:00');
  });
});

describe('Focus Presets - Constants Validation', () => {
  it('contains valid FOCUS_MODES configuration', () => {
    assert.ok(FOCUS_MODES.length >= 4);
    const pomodoro = FOCUS_MODES.find((m) => m.key === 'pomodoro');
    assert.ok(pomodoro);
    assert.equal(pomodoro.workMinutes, 25);
    assert.equal(pomodoro.shortBreakMinutes, 5);

    const flow = FOCUS_MODES.find((m) => m.key === 'flow');
    assert.ok(flow);
    assert.equal(flow.workMinutes, 0); // stopwatch mode
  });

  it('contains valid BREAK_ACTIVITIES', () => {
    assert.ok(BREAK_ACTIVITIES.length >= 4);
    BREAK_ACTIVITIES.forEach((activity) => {
      assert.ok(activity.key);
      assert.ok(activity.title);
      assert.ok(activity.instruction);
    });
  });
});
