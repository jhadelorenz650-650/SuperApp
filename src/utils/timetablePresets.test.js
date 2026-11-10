import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAYS_OF_WEEK,
  exportTimetableToICS,
  findTimeConflict,
  formatDuration,
  formatTimeRange,
  getClassColor,
  getLiveClassStatus,
  getSampleTimetable,
  minutesToTime,
  timeToMinutes,
} from './timetablePresets.js';

describe('Timetable Presets - Time Math & Formatting', () => {
  it('converts HH:MM strings to minutes from midnight', () => {
    assert.equal(timeToMinutes('00:00'), 0);
    assert.equal(timeToMinutes('09:30'), 570);
    assert.equal(timeToMinutes('12:00'), 720);
    assert.equal(timeToMinutes('23:59'), 1439);
    assert.equal(timeToMinutes(''), 0);
    assert.equal(timeToMinutes(null), 0);
    assert.equal(timeToMinutes(undefined), 0);
    assert.equal(timeToMinutes('invalid'), 0);
    assert.equal(timeToMinutes(123), 0);
  });

  it('converts minutes from midnight to readable 12-hour and 24-hour strings', () => {
    assert.equal(minutesToTime(0), '12:00 AM');
    assert.equal(minutesToTime(570), '9:30 AM');
    assert.equal(minutesToTime(720), '12:00 PM');
    assert.equal(minutesToTime(810), '1:30 PM');
    assert.equal(minutesToTime(1380), '11:00 PM');

    assert.equal(minutesToTime(570, true), '09:30');
    assert.equal(minutesToTime(810, true), '13:30');

    // Edge cases: NaN, negative, non-numeric
    assert.equal(minutesToTime(NaN), '12:00 AM');
    assert.equal(minutesToTime(-50), '12:00 AM');
    assert.equal(minutesToTime(NaN, true), '00:00');
    assert.equal(minutesToTime(-50, true), '00:00');
  });

  it('formats time ranges correctly', () => {
    assert.equal(formatTimeRange('09:00', '10:15'), '9:00 AM – 10:15 AM');
    assert.equal(formatTimeRange('', '10:15'), '');
    assert.equal(formatTimeRange('09:00', null), '');
  });

  it('formats durations in human-friendly format', () => {
    assert.equal(formatDuration('09:00', '10:15'), '1h 15m');
    assert.equal(formatDuration('09:00', '10:00'), '1h');
    assert.equal(formatDuration('09:00', '09:45'), '45m');
    assert.equal(formatDuration('10:00', '09:00'), '0m');
    assert.equal(formatDuration('abc', 'def'), '0m');
    assert.equal(formatDuration(null, null), '0m');
  });
});

describe('Timetable Presets - Conflict Detection', () => {
  const sampleClasses = [
    {
      id: 'cls-1',
      title: 'Algorithms',
      courseCode: 'CS 201',
      days: [1, 3, 5], // Mon, Wed, Fri
      startTime: '09:00',
      endTime: '10:15',
    },
    {
      id: 'cls-2',
      title: 'Physics Lab',
      courseCode: 'PHYS 102',
      days: [2, 4], // Tue, Thu
      startTime: '13:00',
      endTime: '15:00',
    },
  ];

  it('detects overlap on matching days', () => {
    const candidate = {
      days: [1], // Monday
      startTime: '09:30',
      endTime: '11:00',
    };
    const conflict = findTimeConflict(sampleClasses, candidate);
    assert.ok(conflict);
    assert.equal(conflict.conflictWith.id, 'cls-1');
  });

  it('allows adjacent classes touching boundaries without conflict', () => {
    const candidate = {
      days: [1], // Monday
      startTime: '10:15',
      endTime: '11:30',
    };
    const conflict = findTimeConflict(sampleClasses, candidate);
    assert.equal(conflict, null);
  });

  it('does not conflict on non-overlapping days', () => {
    const candidate = {
      days: [2], // Tuesday
      startTime: '09:00',
      endTime: '10:15',
    };
    const conflict = findTimeConflict(sampleClasses, candidate);
    assert.equal(conflict, null);
  });

  it('ignores candidate when candidateId matches existing class (editing mode)', () => {
    const candidate = {
      days: [1, 3, 5],
      startTime: '09:00',
      endTime: '10:15',
    };
    const conflict = findTimeConflict(sampleClasses, candidate, 'cls-1');
    assert.equal(conflict, null);
  });

  it('handles invalid or empty inputs safely', () => {
    assert.equal(findTimeConflict([], null), null);
    assert.equal(findTimeConflict(null, { days: [1] }), null);
    assert.equal(findTimeConflict(sampleClasses, { days: [], startTime: '09:00', endTime: '10:00' }), null);
  });
});

describe('Timetable Presets - Live Class Radar', () => {
  const classes = [
    {
      id: 'c1',
      title: 'Data Structures',
      courseCode: 'CS 201',
      days: [1], // Monday
      startTime: '09:00',
      endTime: '10:30',
    },
    {
      id: 'c2',
      title: 'Calculus',
      courseCode: 'MATH 204',
      days: [1], // Monday
      startTime: '11:00',
      endTime: '12:30',
    },
  ];

  it('reports in_class status when current time is within class hours', () => {
    // Monday at 09:45 AM
    const mondayAt945 = new Date('2026-11-09T09:45:00');
    // Ensure getDay() returns 1 (Monday)
    const status = getLiveClassStatus(classes, mondayAt945);

    assert.equal(status.status, 'in_class');
    assert.equal(status.activeClass.id, 'c1');
    assert.equal(status.remainingMinutes, 45);
    assert.equal(status.progress, 50);
    assert.equal(status.nextClass.id, 'c2');
  });

  it('reports before_class status with countdown when upcoming', () => {
    // Monday at 08:30 AM
    const mondayAt830 = new Date('2026-11-09T08:30:00');
    const status = getLiveClassStatus(classes, mondayAt830);

    assert.equal(status.status, 'before_class');
    assert.equal(status.nextClass.id, 'c1');
    assert.equal(status.minutesUntil, 30);
  });

  it('reports classes_finished when all classes for today have ended', () => {
    // Monday at 14:00 PM
    const mondayAt1400 = new Date('2026-11-09T14:00:00');
    const status = getLiveClassStatus(classes, mondayAt1400);

    assert.equal(status.status, 'classes_finished');
    assert.equal(status.todayClassesCount, 2);
  });

  it('reports no_classes_today on days with zero classes', () => {
    // Sunday (getDay() === 0)
    const sunday = new Date('2026-11-08T10:00:00');
    const status = getLiveClassStatus(classes, sunday);

    assert.equal(status.status, 'no_classes_today');
    assert.equal(status.todayClassesCount, 0);
  });

  it('handles null, undefined, or string inputs to getLiveClassStatus safely', () => {
    const statusNull = getLiveClassStatus([], null);
    assert.equal(statusNull.status, 'no_classes_today');

    const statusUndefined = getLiveClassStatus(null, undefined);
    assert.equal(statusUndefined.status, 'no_classes_today');

    // String date format input
    const statusString = getLiveClassStatus(classes, '2026-11-09T09:45:00');
    assert.equal(statusString.status, 'in_class');
    assert.equal(statusString.activeClass.id, 'c1');
  });
});

describe('Timetable Presets - iCalendar (.ics) Export', () => {
  it('generates standard RFC 5545 calendar with proper character escaping', () => {
    const testClasses = [
      {
        id: 'test-1',
        title: 'Algorithms & Structures, Part 1',
        courseCode: 'CS 201',
        instructor: 'Dr. Vance; PhD',
        days: [1, 3], // Mon, Wed
        startTime: '09:00',
        endTime: '10:15',
        location: 'Turing Hall, Room 304; Station A',
        notes: 'Bring calculator, pen.\nReview chapter 3.',
      },
    ];

    const ics = exportTimetableToICS(testClasses);

    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('RRULE:FREQ=WEEKLY;BYDAY=MO,WE'));
    // Verify escaped commas and semicolons
    assert.ok(ics.includes('Turing Hall\\, Room 304\\; Station A'));
    assert.ok(ics.includes('Dr. Vance\\; PhD'));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  it('handles empty or malformed class entries in exportTimetableToICS', () => {
    const emptyIcs = exportTimetableToICS([]);
    assert.ok(emptyIcs.includes('BEGIN:VCALENDAR'));
    assert.ok(emptyIcs.includes('END:VCALENDAR'));

    // Malformed time entries should not emit NaN into DTSTART/DTEND
    const malformed = [
      {
        id: 'bad-1',
        title: 'Corrupted Class',
        days: [1],
        startTime: 'invalid',
        endTime: 'bad',
      },
    ];
    const ics = exportTimetableToICS(malformed);
    assert.ok(!ics.includes('NaN'));
    assert.ok(!ics.includes('undefined'));
    assert.ok(ics.includes('DTSTART:'));
  });
});
