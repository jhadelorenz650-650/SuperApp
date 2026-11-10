import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FlaskConical,
  MapPin,
  MessageSquare,
  Palette,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  CLASS_COLORS,
  CLASS_TYPES,
  DAYS_OF_WEEK,
  findTimeConflict,
  formatDuration,
  formatTimeRange,
  timeToMinutes,
} from '../utils/timetablePresets';
import { playPenTapSound, playTaskDeleteSound } from '../utils/soundEffects';

const TYPE_ICONS = {
  BookOpen,
  FlaskConical,
  Users,
  MessageSquare,
  Palette,
  Award,
};

const QUICK_DAY_PATTERNS = [
  { label: 'MWF', days: [1, 3, 5] },
  { label: 'TTh', days: [2, 4] },
  { label: 'Mon–Fri', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [6, 0] },
];

const QUICK_DURATIONS = [
  { label: '50m', minutes: 50 },
  { label: '1h 15m', minutes: 75 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
];

export function ClassModal({
  isOpen,
  classItem = null,
  existingClasses = [],
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(classItem);

  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState('lecture');
  const [location, setLocation] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [days, setDays] = useState([1, 3, 5]); // Default Mon, Wed, Fri
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:15');
  const [colorTheme, setColorTheme] = useState('indigo');
  const [notes, setNotes] = useState('');
  const [targetPct, setTargetPct] = useState(80);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (classItem) {
      setSubject(classItem.subject || '');
      setCourseCode(classItem.courseCode || '');
      setTitle(classItem.title || '');
      setInstructor(classItem.instructor || '');
      setType(classItem.type || 'lecture');
      setLocation(classItem.location || '');
      setOnlineLink(classItem.onlineLink || '');
      setDays(classItem.days && classItem.days.length > 0 ? classItem.days : [1, 3, 5]);
      setStartTime(classItem.startTime || '09:00');
      setEndTime(classItem.endTime || '10:15');
      setColorTheme(classItem.colorTheme || 'indigo');
      setNotes(classItem.notes || '');
      setTargetPct(classItem.attendance?.targetPct ?? 80);
    } else {
      setSubject('');
      setCourseCode('');
      setTitle('');
      setInstructor('');
      setType('lecture');
      setLocation('');
      setOnlineLink('');
      setDays([1, 3, 5]);
      setStartTime('09:00');
      setEndTime('10:15');
      setColorTheme('indigo');
      setNotes('');
      setTargetPct(80);
    }
    setErrors({});
  }, [classItem, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleDay = (dayIndex) => {
    playPenTapSound();
    setDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    });
  };

  const applyDuration = (minutes) => {
    playPenTapSound();
    const startMin = timeToMinutes(startTime);
    const endMin = (startMin + minutes) % (24 * 60);
    const h = String(Math.floor(endMin / 60)).padStart(2, '0');
    const m = String(endMin % 60).padStart(2, '0');
    setEndTime(`${h}:${m}`);
  };

  // Conflict detection
  const conflict = useMemo(() => {
    return findTimeConflict(
      existingClasses,
      { days, startTime, endTime },
      classItem?.id || null
    );
  }, [existingClasses, days, startTime, endTime, classItem]);

  const durationLabel = useMemo(() => {
    return formatDuration(startTime, endTime);
  }, [startTime, endTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim() && !subject.trim()) {
      newErrors.title = 'Please provide a course title or subject name';
    }
    if (days.length === 0) {
      newErrors.days = 'Select at least one day for this class';
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      newErrors.time = 'End time must be after start time';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...(classItem || {}),
      id: classItem?.id || `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subject: (subject.trim() || title.trim()),
      courseCode: courseCode.trim().toUpperCase(),
      title: (title.trim() || subject.trim()),
      instructor: instructor.trim(),
      type,
      location: location.trim(),
      onlineLink: onlineLink.trim(),
      days,
      startTime,
      endTime,
      colorTheme,
      notes: notes.trim(),
      attendance: {
        attended: classItem?.attendance?.attended ?? 0,
        missed: classItem?.attendance?.missed ?? 0,
        targetPct: Number(targetPct) || 80,
      },
      updatedAt: Date.now(),
      createdAt: classItem?.createdAt || Date.now(),
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#24252A]/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#24252A]/10 overflow-hidden my-6 z-10"
        >
          {/* Header */}
          <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-[#24252A]/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: CLASS_COLORS[colorTheme]?.accentHex || '#4E51BF' }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#24252A] tracking-tight">
                  {isEditing ? 'Edit Class Details' : 'Add New Class'}
                </h2>
                <p className="text-xs text-[#5C6070]">
                  Configure your weekly schedule, room location, and class times
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8A8F9E] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Conflict Warning Banner */}
            {conflict && (
              <div
                role="alert"
                className="rounded-2xl bg-[#FFE9CE] border border-[#F6D1A2] p-3.5 flex items-start gap-3 text-xs text-[#8A530D]"
              >
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold">Schedule Overlap Notice: </span>
                  This class overlaps with{' '}
                  <span className="font-semibold underline">
                    {conflict.conflictWith.courseCode || conflict.conflictWith.title}
                  </span>{' '}
                  on {conflict.dayNames} ({formatTimeRange(conflict.conflictWith.startTime, conflict.conflictWith.endTime)}).
                </div>
              </div>
            )}

            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
              <div
                role="alert"
                className="rounded-2xl bg-[#FFE1E6] border border-[#FF92A4]/60 p-3 flex items-center gap-2.5 text-xs text-[#9F1239]"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{Object.values(errors)[0]}</span>
              </div>
            )}

            {/* Title & Course Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] px-3.5 py-2.5 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS 201"
                  className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] px-3.5 py-2.5 text-xs sm:text-sm font-semibold uppercase text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                />
              </div>
            </div>

            {/* Subject Tag & Instructor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">Subject / Department</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] px-3.5 py-2.5 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">Professor / Instructor</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F9E]" />
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Dr. Alan Vance"
                    className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Class Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#24252A]">Class Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CLASS_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t.icon] || BookOpen;
                  const isSelected = type === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        setType(t.key);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#4E51BF] text-white border-[#4E51BF] shadow-sm'
                          : 'bg-[#F8F9FA] hover:bg-[#F0F1F5] text-[#5C6070] border-[#24252A]/[0.06]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meeting Days */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#24252A]">
                  Meeting Days <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {QUICK_DAY_PATTERNS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        setDays(p.days);
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#24252A]/[0.05] hover:bg-[#24252A]/10 text-[#5C6070] cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = days.includes(d.index);
                  return (
                    <button
                      key={d.index}
                      type="button"
                      onClick={() => toggleDay(d.index)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#4E51BF] text-white shadow-sm'
                          : 'bg-[#F8F9FA] hover:bg-[#F0F1F5] text-[#5C6070] border border-[#24252A]/[0.06]'
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeslot & Quick Duration */}
            <div className="space-y-2 bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#24252A]/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#24252A]">
                  <Clock className="w-3.5 h-3.5 text-[#4E51BF]" />
                  <span>Time Schedule ({durationLabel})</span>
                </div>
                <div className="flex items-center gap-1">
                  {QUICK_DURATIONS.map((qd) => (
                    <button
                      key={qd.label}
                      type="button"
                      onClick={() => applyDuration(qd.minutes)}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#24252A]/[0.08] text-[#5C6070] hover:text-[#24252A] cursor-pointer"
                    >
                      +{qd.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-[#8A8F9E] block mb-1">Start Time</span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#24252A]/[0.08] px-3 py-2 text-xs sm:text-sm font-semibold text-[#24252A] focus:outline-none focus:border-[#4E51BF]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#8A8F9E] block mb-1">End Time</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#24252A]/[0.08] px-3 py-2 text-xs sm:text-sm font-semibold text-[#24252A] focus:outline-none focus:border-[#4E51BF]"
                  />
                </div>
              </div>
            </div>

            {/* Location & Online Meeting Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">Room / Hall Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F9E]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Turing Hall, Room 304"
                    className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#24252A]">Online Meeting Link (Optional)</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F9E]" />
                  <input
                    type="url"
                    value={onlineLink}
                    onChange={(e) => setOnlineLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Color Theme Palette */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#24252A]">Color Theme</label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {Object.values(CLASS_COLORS).map((c) => {
                  const isSelected = colorTheme === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        setColorTheme(c.key);
                      }}
                      title={c.label}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'scale-110 ring-2 ring-offset-2 ring-[#4E51BF]'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.accentHex }}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes & Syllabus Reminders */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#24252A]">Notes & Reminders</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bring safety goggles, problem set due dates, exam guidelines..."
                className="w-full rounded-xl bg-[#F8F9FA] border border-[#24252A]/[0.08] px-3.5 py-2 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white resize-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-5 sm:px-7 py-4 bg-[#F8F9FA] border-t border-[#24252A]/[0.07] flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  playTaskDeleteSound();
                  onDelete(classItem.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5C6070] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#4E51BF] hover:bg-[#3B3E9E] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Class'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
