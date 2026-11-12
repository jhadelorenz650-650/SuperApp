// Color themes for class cards matching Pulse - Student OS visual palette
export const CLASS_COLORS = {
  indigo: {
    key: 'indigo',
    label: 'Cornflower Blue',
    bg: 'bg-[#5B8DEF]',
    lightBg: 'bg-[#EAF0FC]',
    border: 'border-[#5B8DEF]/35',
    text: 'text-[#2F59B8]',
    darkText: 'text-[#121316]',
    gradient: 'from-[#5B8DEF] to-[#3762C4]',
    bannerBg: 'bg-[#F5F8FE]',
    accentHex: '#5B8DEF',
  },
  coral: {
    key: 'coral',
    label: 'Coral Rose',
    bg: 'bg-[#FF92A4]',
    lightBg: 'bg-[#FF92A4]/15',
    border: 'border-[#FF92A4]/40',
    text: 'text-[#E11D48]',
    darkText: 'text-[#9F1239]',
    gradient: 'from-[#FF92A4] to-[#F43F5E]',
    bannerBg: 'bg-[#FFEBEF]',
    accentHex: '#FF92A4',
  },
  peach: {
    key: 'peach',
    label: 'Warm Amber',
    bg: 'bg-[#F59E0B]',
    lightBg: 'bg-[#FFE9CE]',
    border: 'border-[#F6D1A2]',
    text: 'text-[#B45309]',
    darkText: 'text-[#78350F]',
    gradient: 'from-[#F59E0B] to-[#D97706]',
    bannerBg: 'bg-[#FFF7ED]',
    accentHex: '#F59E0B',
  },
  emerald: {
    key: 'emerald',
    label: 'Forest Emerald',
    bg: 'bg-[#10B981]',
    lightBg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-700',
    darkText: 'text-emerald-900',
    gradient: 'from-[#10B981] to-[#059669]',
    bannerBg: 'bg-[#ECFDF5]',
    accentHex: '#10B981',
  },
  sky: {
    key: 'sky',
    label: 'Ocean Cyan',
    bg: 'bg-[#0284C7]',
    lightBg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-700',
    darkText: 'text-sky-900',
    gradient: 'from-[#0284C7] to-[#0369A1]',
    bannerBg: 'bg-[#F0F9FF]',
    accentHex: '#0284C7',
  },
  plum: {
    key: 'plum',
    label: 'Royal Plum',
    bg: 'bg-[#7C4DFF]',
    lightBg: 'bg-[#7C4DFF]/12',
    border: 'border-[#7C4DFF]/25',
    text: 'text-[#7C4DFF]',
    darkText: 'text-[#4A148C]',
    gradient: 'from-[#7C4DFF] to-[#651FFF]',
    bannerBg: 'bg-[#F3E8FF]',
    accentHex: '#7C4DFF',
  },
  charcoal: {
    key: 'charcoal',
    label: 'Ink Black',
    bg: 'bg-[#121316]',
    lightBg: 'bg-[#121316]/[0.08]',
    border: 'border-[#121316]/20',
    text: 'text-[#121316]',
    darkText: 'text-[#121316]',
    gradient: 'from-[#121316] to-[#282B33]',
    bannerBg: 'bg-[#FAF9F6]',
    accentHex: '#121316',
  },
};

export const CLASS_TYPES = [
  { key: 'lecture', label: 'Lecture', icon: 'BookOpen', badgeClass: 'bg-[#EAF0FC] text-[#2F59B8]' },
  { key: 'lab', label: 'Lab', icon: 'FlaskConical', badgeClass: 'bg-emerald-50 text-emerald-700' },
  { key: 'tutorial', label: 'Tutorial', icon: 'Users', badgeClass: 'bg-[#ECE9E1] text-[#121316]' },
  { key: 'seminar', label: 'Seminar', icon: 'MessageSquare', badgeClass: 'bg-rose-50 text-rose-800' },
  { key: 'studio', label: 'Studio', icon: 'Palette', badgeClass: 'bg-[#EAF0FC] text-[#2F59B8]' },
  { key: 'quiz', label: 'Quiz / Exam', icon: 'Award', badgeClass: 'bg-[#121316] text-[#FAF9F6] font-bold' },
];

export const DAYS_OF_WEEK = [
  { index: 1, short: 'Mon', full: 'Monday' },
  { index: 2, short: 'Tue', full: 'Tuesday' },
  { index: 3, short: 'Wed', full: 'Wednesday' },
  { index: 4, short: 'Thu', full: 'Thursday' },
  { index: 5, short: 'Fri', full: 'Friday' },
  { index: 6, short: 'Sat', full: 'Saturday' },
  { index: 0, short: 'Sun', full: 'Sunday' },
];

export function getClassColor(colorKey) {
  return CLASS_COLORS[colorKey] || CLASS_COLORS.indigo;
}

// Convert "09:30" string to minutes from midnight
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.max(0, h * 60 + m);
}

// Convert minutes from midnight to "9:30 AM" or "09:30"
export function minutesToTime(minutes, format24 = false) {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return format24 ? '00:00' : '12:00 AM';
  }
  const total = Math.floor(minutes);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  if (format24) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startStr, endStr) {
  if (!startStr || !endStr) return '';
  return `${minutesToTime(timeToMinutes(startStr))} – ${minutesToTime(timeToMinutes(endStr))}`;
}

// Format duration into readable string like "1h 30m"
export function formatDuration(startStr, endStr) {
  const diff = timeToMinutes(endStr) - timeToMinutes(startStr);
  if (!Number.isFinite(diff) || diff <= 0) return '0m';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Find if any class conflicts with new timeslot on a given day
export function findTimeConflict(existingClasses, candidate, candidateId = null) {
  if (!candidate || !existingClasses || !Array.isArray(existingClasses)) return null;
  const candidateDays = Array.isArray(candidate.days) ? candidate.days : [];
  if (candidateDays.length === 0 || !candidate.startTime || !candidate.endTime) return null;

  const startMin = timeToMinutes(candidate.startTime);
  const endMin = timeToMinutes(candidate.endTime);
  if (endMin <= startMin) return null;

  for (const cls of existingClasses) {
    if (candidateId && cls.id === candidateId) continue;
    const commonDays = (cls.days || []).filter((d) => candidateDays.includes(d));
    if (commonDays.length === 0) continue;

    const clsStart = timeToMinutes(cls.startTime);
    const clsEnd = timeToMinutes(cls.endTime);
    if (clsEnd <= clsStart) continue;

    // Overlap condition: start < otherEnd && end > otherStart
    if (startMin < clsEnd && endMin > clsStart) {
      const dayNames = commonDays
        .map((d) => DAYS_OF_WEEK.find((item) => item.index === d)?.short || `Day ${d}`)
        .join(', ');
      return {
        conflictWith: cls,
        dayNames,
      };
    }
  }
  return null;
}

// Live Status: determines current class, next class, and free break
export function getLiveClassStatus(classes, currentDateTime = new Date()) {
  if (!classes || !Array.isArray(classes)) {
    return {
      status: 'no_classes_today',
      todayClassesCount: 0,
      activeClass: null,
      nextClass: null,
      breakMinutes: 0,
    };
  }

  const now =
    currentDateTime instanceof Date && !Number.isNaN(currentDateTime.getTime())
      ? currentDateTime
      : typeof currentDateTime === 'number' || typeof currentDateTime === 'string'
        ? new Date(currentDateTime)
        : new Date();

  if (Number.isNaN(now.getTime())) {
    return {
      status: 'no_classes_today',
      todayClassesCount: 0,
      activeClass: null,
      nextClass: null,
      breakMinutes: 0,
    };
  }

  const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter classes happening today
  const todayClasses = classes
    .filter((c) => (c.days || []).includes(dayIndex))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (todayClasses.length === 0) {
    return {
      status: 'no_classes_today',
      todayClassesCount: 0,
      activeClass: null,
      nextClass: null,
      breakMinutes: 0,
    };
  }

  // Check if currently inside a class
  const activeClass = todayClasses.find((c) => {
    const s = timeToMinutes(c.startTime);
    const e = timeToMinutes(c.endTime);
    return currentMinutes >= s && currentMinutes < e;
  });

  if (activeClass) {
    const s = timeToMinutes(activeClass.startTime);
    const e = timeToMinutes(activeClass.endTime);
    const progress = Math.min(100, Math.max(0, ((currentMinutes - s) / Math.max(1, e - s)) * 100));
    const remainingMinutes = Math.max(0, e - currentMinutes);

    // Find class immediately after this one
    const subsequentClasses = todayClasses.filter((c) => timeToMinutes(c.startTime) >= e);
    const nextClass = subsequentClasses[0] || null;

    return {
      status: 'in_class',
      activeClass,
      progress: Math.round(progress),
      remainingMinutes,
      nextClass,
      todayClassesCount: todayClasses.length,
    };
  }

  // Not in class. Check for next upcoming class today
  const upcomingClasses = todayClasses.filter((c) => timeToMinutes(c.startTime) > currentMinutes);

  if (upcomingClasses.length > 0) {
    const nextClass = upcomingClasses[0];
    const minutesUntil = timeToMinutes(nextClass.startTime) - currentMinutes;

    return {
      status: 'before_class',
      activeClass: null,
      nextClass,
      minutesUntil,
      todayClassesCount: todayClasses.length,
    };
  }

  // All classes today are finished
  return {
    status: 'classes_finished',
    activeClass: null,
    nextClass: null,
    todayClassesCount: todayClasses.length,
  };
}

// Sample balanced student timetable for 1-click starter template
export function getSampleTimetable() {
  const now = Date.now();
  return [
    {
      id: `cls-${now}-1`,
      subject: 'Computer Science',
      courseCode: 'CS 201',
      title: 'Data Structures & Algorithms',
      instructor: 'Dr. Alan Vance',
      type: 'lecture',
      location: 'Turing Hall, Room 304',
      onlineLink: 'https://meet.google.com',
      days: [1, 3, 5], // Mon, Wed, Fri
      startTime: '09:00',
      endTime: '10:15',
      colorTheme: 'indigo',
      notes: 'Weekly problem set due every Friday by 5 PM.',
      attendance: { attended: 14, missed: 1, targetPct: 80 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cls-${now}-2`,
      subject: 'Mathematics',
      courseCode: 'MATH 204',
      title: 'Linear Algebra & Applications',
      instructor: 'Prof. Katherine Bell',
      type: 'lecture',
      location: 'Euler Hall, Auditorium B',
      onlineLink: '',
      days: [1, 3], // Mon, Wed
      startTime: '11:00',
      endTime: '12:30',
      colorTheme: 'peach',
      notes: 'Midterm exam coming up on Week 8. Bring calculator.',
      attendance: { attended: 11, missed: 0, targetPct: 85 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cls-${now}-3`,
      subject: 'Physics',
      courseCode: 'PHYS 102',
      title: 'Electromagnetism Lab',
      instructor: 'Dr. Marcus Sterling',
      type: 'lab',
      location: 'Curie Science Complex, Lab 210',
      onlineLink: '',
      days: [2, 4], // Tue, Thu
      startTime: '13:00',
      endTime: '15:00',
      colorTheme: 'emerald',
      notes: 'Lab coat and safety goggles required at all times.',
      attendance: { attended: 8, missed: 1, targetPct: 90 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cls-${now}-4`,
      subject: 'Writing & Comm',
      courseCode: 'ENG 101',
      title: 'Technical Communication & Seminars',
      instructor: 'Prof. Diana Ruiz',
      type: 'seminar',
      location: 'Humanities Wing, Room 112',
      onlineLink: '',
      days: [2, 4], // Tue, Thu
      startTime: '10:00',
      endTime: '11:15',
      colorTheme: 'coral',
      notes: 'Peer review session next Thursday for draft report.',
      attendance: { attended: 9, missed: 0, targetPct: 80 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cls-${now}-5`,
      subject: 'Artificial Intelligence',
      courseCode: 'CS 320',
      title: 'Machine Learning Studio',
      instructor: 'Dr. Kenji Sato',
      type: 'studio',
      location: 'Innovation Hub, Studio 4',
      onlineLink: 'https://zoom.us',
      days: [5], // Friday
      startTime: '13:30',
      endTime: '16:00',
      colorTheme: 'plum',
      notes: 'GPU cluster login credentials on course syllabus portal.',
      attendance: { attended: 5, missed: 0, targetPct: 80 },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Helper to escape special RFC 5545 characters in text fields
function escapeICS(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Generate standard RFC 5545 iCalendar (.ics) export file
export function exportTimetableToICS(classes) {
  if (!classes || !Array.isArray(classes)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const icsDaysMap = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pulse Student OS//Student Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pulse Class Timetable',
  ];

  classes.forEach((cls) => {
    const daysList = (cls.days || []).map((d) => icsDaysMap[d]).filter(Boolean).join(',');
    if (!daysList) return;

    // Pick next matching day for DTSTART
    const firstDayIndex = cls.days[0];
    const targetDate = new Date();
    const currentDay = targetDate.getDay();
    const dayDiff = (firstDayIndex - currentDay + 7) % 7;
    targetDate.setDate(targetDate.getDate() + dayDiff);

    const startMinutes = timeToMinutes(cls.startTime || '09:00');
    const endMinutes = timeToMinutes(cls.endTime || '10:00');
    const sh = Math.floor(startMinutes / 60);
    const sm = startMinutes % 60;
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;

    const dtStart = `${targetDate.getFullYear()}${pad(targetDate.getMonth() + 1)}${pad(targetDate.getDate())}T${pad(sh)}${pad(sm)}00`;
    const dtEnd = `${targetDate.getFullYear()}${pad(targetDate.getMonth() + 1)}${pad(targetDate.getDate())}T${pad(eh)}${pad(em)}00`;

    const summary = escapeICS(`${cls.courseCode ? `${cls.courseCode}: ` : ''}${cls.title || cls.subject || 'Class'}`);
    const desc = escapeICS(`${cls.instructor ? `Instructor: ${cls.instructor}\n` : ''}${cls.notes || ''}`);
    const loc = escapeICS(cls.location || '');

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${cls.id || Date.now()}@pulse-student-os`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${daysList}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

// Trigger browser download of .ics file
export function downloadICSFile(classes) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const icsString = exportTimetableToICS(classes);
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pulse_timetable_${dateStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
