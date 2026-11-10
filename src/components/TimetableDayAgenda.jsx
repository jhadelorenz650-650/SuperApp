import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  MapPin,
  NotebookPen,
  Plus,
  Sparkles,
  Timer,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  formatDuration,
  formatTimeRange,
  getClassColor,
  timeToMinutes,
} from '../utils/timetablePresets';
import {
  playLiquidWaveSound,
  playPenTapSound,
  playTaskDoneSound,
} from '../utils/soundEffects';

export function TimetableDayAgenda({
  classes = [],
  selectedDayIndex,
  onSelectDayIndex,
  onOpenClass,
  onOpenNotebookForSubject,
  onUpdateAttendance,
  onOpenNewClass,
}) {
  const navigate = useNavigate();
  const todayIndex = new Date().getDay();

  // Classes on the selected day, sorted chronologically
  const dayClasses = useMemo(() => {
    return classes
      .filter((c) => (c.days || []).includes(selectedDayIndex))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [classes, selectedDayIndex]);

  // Compute breaks between consecutive classes
  const agendaItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < dayClasses.length; i += 1) {
      const current = dayClasses[i];
      items.push({ type: 'class', data: current });

      if (i < dayClasses.length - 1) {
        const next = dayClasses[i + 1];
        const gapMin = timeToMinutes(next.startTime) - timeToMinutes(current.endTime);
        if (gapMin >= 20) {
          items.push({
            type: 'break',
            gapMinutes: gapMin,
            after: current,
            before: next,
          });
        }
      }
    }
    return items;
  }, [dayClasses]);

  const handleStartFocus = (subjectName) => {
    playLiquidWaveSound();
    try {
      if (subjectName) {
        window.sessionStorage.setItem('superapp_focus_subject_v1', subjectName);
      }
    } catch {
      // Ignore
    }
    navigate('/focus');
  };

  const selectedDayMeta = DAYS_OF_WEEK.find((d) => d.index === selectedDayIndex) || DAYS_OF_WEEK[0];

  return (
    <div className="space-y-4">
      {/* Day Selector Pills Bar */}
      <div className="glass-card rounded-2xl p-1.5 flex items-center justify-between gap-1 overflow-x-auto">
        {DAYS_OF_WEEK.map((d) => {
          const isSelected = d.index === selectedDayIndex;
          const isToday = d.index === todayIndex;
          const classCount = classes.filter((c) => (c.days || []).includes(d.index)).length;

          return (
            <button
              key={d.index}
              type="button"
              onClick={() => {
                playPenTapSound();
                onSelectDayIndex(d.index);
              }}
              className={`flex-1 min-w-[72px] py-2 px-2 rounded-xl text-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[#4E51BF] text-white shadow-sm'
                  : 'text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.04]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-bold">{d.short}</span>
                {isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#FFE9CE]' : 'bg-[#4E51BF]'
                    }`}
                  />
                )}
              </div>
              <div
                className={`text-[10px] mt-0.5 ${
                  isSelected ? 'text-indigo-100' : 'text-[#8A8F9E]'
                }`}
              >
                {classCount} {classCount === 1 ? 'class' : 'classes'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Agenda Timeline */}
      <div className="space-y-3">
        {agendaItems.length > 0 ? (
          agendaItems.map((item, idx) => {
            if (item.type === 'break') {
              const h = Math.floor(item.gapMinutes / 60);
              const m = item.gapMinutes % 60;
              const breakLabel = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`) : `${m} minutes`;

              return (
                <div
                  key={`break-${idx}`}
                  className="rounded-2xl border border-dashed border-[#F2CFA4]/80 bg-[#FFE9CE]/35 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 text-[#5C4630]">
                    <div className="w-8 h-8 rounded-xl bg-[#FFE9CE] flex items-center justify-center shrink-0">
                      <Coffee className="w-4 h-4 text-[#B45309]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#24252A]">
                        {breakLabel} Study Gap
                      </span>
                      <p className="text-[11px] text-[#78350F] mt-0.5">
                        Free time before {item.before.courseCode || item.before.title}. Great opportunity for focus or prep.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartFocus(item.before.subject)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-[#24252A] hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] shadow-sm transition-colors cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5 text-[#4E51BF]" />
                    <span>Start Focus Session</span>
                  </button>
                </div>
              );
            }

            const cls = item.data;
            const theme = getClassColor(cls.colorTheme);
            const attendance = cls.attendance || { attended: 0, missed: 0, targetPct: 80 };
            const totalSessions = (attendance.attended || 0) + (attendance.missed || 0);
            const currentPct = totalSessions > 0 ? Math.round((attendance.attended / totalSessions) * 100) : 100;

            return (
              <motion.div
                key={cls.id}
                whileHover={{ y: -2 }}
                className={`glass-card rounded-2xl p-4 sm:p-5 border ${theme.border} relative overflow-hidden transition-all shadow-sm`}
              >
                {/* Left Colored Accent Strip */}
                <div
                  aria-hidden="true"
                  className={`absolute left-0 inset-y-0 w-1.5 ${theme.bg}`}
                />

                <div className="pl-2 space-y-3">
                  {/* Top Bar: Code, Type, Time & Duration */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${theme.lightBg} ${theme.text}`}
                      >
                        {cls.courseCode || cls.subject}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#24252A]/[0.05] text-[#5C6070] capitalize">
                        {cls.type || 'Lecture'}
                      </span>
                      <span className="text-xs font-medium text-[#5C6070]">
                        {cls.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#24252A]">
                      <Clock className="w-3.5 h-3.5 text-[#4E51BF]" />
                      <span>{formatTimeRange(cls.startTime, cls.endTime)}</span>
                      <span className="text-[11px] text-[#8A8F9E] font-normal">
                        ({formatDuration(cls.startTime, cls.endTime)})
                      </span>
                    </div>
                  </div>

                  {/* Title & Instructor */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => onOpenClass(cls)}
                        className="font-display text-base sm:text-lg font-bold text-[#24252A] hover:text-[#4E51BF] transition-colors cursor-pointer"
                      >
                        {cls.title}
                      </h3>
                      {cls.instructor && (
                        <div className="flex items-center gap-1.5 text-xs text-[#5C6070] mt-0.5">
                          <User className="w-3.5 h-3.5 text-[#8A8F9E]" />
                          <span>{cls.instructor}</span>
                        </div>
                      )}
                    </div>

                    {/* Location & Online link */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[#5C6070]">
                      {cls.location && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[#24252A]/[0.08]">
                          <MapPin className="w-3.5 h-3.5 text-[#4E51BF]" />
                          <span className="font-medium text-[#24252A]">{cls.location}</span>
                        </span>
                      )}
                      {cls.onlineLink && (
                        <a
                          href={cls.onlineLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#4E51BF]/10 text-[#4E51BF] font-semibold hover:bg-[#4E51BF]/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Join Online</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Class Notes if present */}
                  {cls.notes && (
                    <div className="text-xs text-[#5C6070] bg-[#F8F9FA] rounded-xl p-2.5 border border-[#24252A]/[0.05]">
                      <span className="font-semibold text-[#24252A]">Notes: </span>
                      {cls.notes}
                    </div>
                  )}

                  {/* Bottom Row: Attendance Logger & Quick Notebook Action */}
                  <div className="pt-2 border-t border-[#24252A]/[0.06] flex flex-wrap items-center justify-between gap-3">
                    {/* Attendance Mini Tracker */}
                    <div className="flex items-center gap-3">
                      <div className="text-xs">
                        <span className="text-[#8A8F9E]">Attendance: </span>
                        <span className="font-bold text-[#24252A]">
                          {attendance.attended} / {totalSessions}
                        </span>
                        <span
                          className={`ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                            currentPct >= (attendance.targetPct || 80)
                              ? 'bg-emerald-500/12 text-emerald-800'
                              : 'bg-rose-500/12 text-rose-700'
                          }`}
                        >
                          {currentPct}%
                        </span>
                      </div>

                      {/* Quick Log Buttons */}
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            playTaskDoneSound();
                            onUpdateAttendance(cls.id, 'attended');
                          }}
                          title="Mark Attended (+1 Present)"
                          className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playPenTapSound();
                            onUpdateAttendance(cls.id, 'missed');
                          }}
                          title="Mark Missed (+1 Absence)"
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notebook & Details Action */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenNotebookForSubject(cls.subject || cls.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
                      >
                        <NotebookPen className="w-3.5 h-3.5 text-[#4E51BF]" />
                        <span>Class Notebook</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenClass(cls)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#24252A] hover:bg-[#3B3E9E] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE9CE] flex items-center justify-center mx-auto text-[#4E51BF]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-[#24252A]">
                No classes scheduled on {selectedDayMeta.full}
              </h4>
              <p className="text-xs text-[#5C6070] max-w-sm mx-auto mt-1">
                Your schedule is wide open. Enjoy your free time or schedule a class below.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewClass}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4E51BF] hover:bg-[#3B3E9E] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class for {selectedDayMeta.short}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
