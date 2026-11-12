import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  NotebookPen,
  Plus,
  Trash2,
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
  playPenTapSound,
  playTaskDeleteSound,
  playTaskDoneSound,
} from '../utils/soundEffects';

export function TimetableCourseList({
  classes = [],
  onOpenClass,
  onOpenNotebookForSubject,
  onUpdateAttendance,
  onDeleteClass,
  onOpenNewClass,
}) {
  // Compute overall semester attendance statistics
  const stats = useMemo(() => {
    let totalAttended = 0;
    let totalMissed = 0;
    let totalWeeklyHoursMin = 0;

    classes.forEach((cls) => {
      const att = cls.attendance || { attended: 0, missed: 0 };
      totalAttended += att.attended || 0;
      totalMissed += att.missed || 0;

      const durationMin = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
      const daysCount = (cls.days || []).length;
      totalWeeklyHoursMin += durationMin * daysCount;
    });

    const totalSessions = totalAttended + totalMissed;
    const overallPct = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 100;
    const weeklyHours = (totalWeeklyHoursMin / 60).toFixed(1);

    return {
      totalCourses: classes.length,
      totalAttended,
      totalMissed,
      totalSessions,
      overallPct,
      weeklyHours,
    };
  }, [classes]);

  return (
    <div className="space-y-5">
      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-[#6E7382] uppercase tracking-wider">
            Total Courses
          </div>
          <div className="font-display text-2xl font-bold text-[#121316] mt-1 tabular-nums">
            {stats.totalCourses}
          </div>
          <div className="text-[11px] text-[#424652] mt-0.5">Active this semester</div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-[#6E7382] uppercase tracking-wider">
            Weekly Class Load
          </div>
          <div className="font-display text-2xl font-bold text-[#2F59B8] mt-1 tabular-nums">
            {stats.weeklyHours}h
          </div>
          <div className="text-[11px] text-[#424652] mt-0.5">In lecture & labs</div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-[#6E7382] uppercase tracking-wider">
            Attendance Rate
          </div>
          <div className="font-display text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {stats.overallPct}%
          </div>
          <div className="text-[11px] text-[#424652] mt-0.5 tabular-nums">
            {stats.totalAttended} / {stats.totalSessions} sessions
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-[#6E7382] uppercase tracking-wider">
            Total Absences
          </div>
          <div className="font-display text-2xl font-bold text-rose-700 mt-1 tabular-nums">
            {stats.totalMissed}
          </div>
          <div className="text-[11px] text-[#424652] mt-0.5">Across all subjects</div>
        </div>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((cls) => {
          const theme = getClassColor(cls.colorTheme);
          const att = cls.attendance || { attended: 0, missed: 0, targetPct: 80 };
          const totalCourseSessions = (att.attended || 0) + (att.missed || 0);
          const coursePct = totalCourseSessions > 0 ? Math.round((att.attended / totalCourseSessions) * 100) : 100;
          const target = att.targetPct || 80;
          const isAboveTarget = coursePct >= target;

          // Days string (e.g. "Mon, Wed, Fri")
          const daysStr = (cls.days || [])
            .map((d) => DAYS_OF_WEEK.find((item) => item.index === d)?.short)
            .join(', ');

          // Cut Calculator: estimate how many absences left before dropping below target
          // Formula: (attended) / (total + x) >= target/100  =>  x <= (attended * 100 / target) - total
          let safeCuts = 0;
          if (totalCourseSessions > 0) {
            safeCuts = Math.max(0, Math.floor((att.attended * 100) / target - totalCourseSessions));
          }

          return (
            <motion.div
              key={cls.id}
              whileHover={{ y: -2 }}
              className={`glass-card rounded-2xl p-5 border ${theme.border} flex flex-col justify-between gap-4 transition-all shadow-sm`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${theme.lightBg} ${theme.text}`}
                    >
                      {cls.courseCode || cls.subject}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#121316]/[0.06] text-[#424652] capitalize">
                      {cls.type || 'Lecture'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenClass(cls)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-[#121316]/[0.06] text-[#121316] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTaskDeleteSound();
                        onDeleteClass(cls.id);
                      }}
                      className="p-1 rounded-lg text-[#6E7382] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  onClick={() => onOpenClass(cls)}
                  className="font-display text-base sm:text-lg font-bold text-[#121316] mt-2 hover:text-[#2F59B8] transition-colors cursor-pointer"
                >
                  {cls.title}
                </h3>
                <div className="text-xs text-[#424652] mt-0.5">{cls.subject}</div>

                {cls.instructor && (
                  <div className="flex items-center gap-1.5 text-xs text-[#424652] mt-2">
                    <User className="w-3.5 h-3.5 text-[#6E7382]" />
                    <span>{cls.instructor}</span>
                  </div>
                )}

                {/* Schedule and Location */}
                <div className="mt-3 pt-3 border-t border-[#121316]/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#424652]">
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#5B8DEF]" />
                    <span className="font-semibold text-[#121316]">{daysStr}</span>
                    <span>•</span>
                    <span>{formatTimeRange(cls.startTime, cls.endTime)}</span>
                  </div>

                  {cls.location && (
                    <div className="flex items-center gap-1 text-[#121316]">
                      <MapPin className="w-3.5 h-3.5 text-[#6E7382]" />
                      <span>{cls.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Tracking Box */}
              <div className="rounded-xl bg-white p-3.5 border border-[#121316]/[0.09] space-y-2.5">
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <div className="flex items-center gap-1.5 font-semibold text-[#121316]">
                    <span>Attendance Standing:</span>
                    <span className={isAboveTarget ? 'text-emerald-700' : 'text-rose-700'}>
                      {coursePct}%
                    </span>
                    <span className="text-[10px] font-normal text-[#6E7382]">
                      (target {target}%)
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#121316]">
                    {att.attended} Attended • {att.missed} Missed
                  </div>
                </div>

                {/* Attendance Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#ECE9E1] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveTarget ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(100, coursePct)}%` }}
                  />
                </div>

                {/* Attendance Policy / Cut Advisory */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#424652] inline-flex items-center gap-1.5">
                    {isAboveTarget ? (
                      totalCourseSessions === 0 ? (
                        'No sessions recorded yet'
                      ) : safeCuts === 0 ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>On target threshold: any missed class will drop below {target}%</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Safe to miss ~{safeCuts} more class{safeCuts === 1 ? '' : 'es'} without dropping below {target}%</span>
                        </>
                      )
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>Below attendance threshold. Attend upcoming classes.</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playTaskDoneSound();
                        onUpdateAttendance(cls.id, 'attended');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold cursor-pointer"
                    >
                      +1 Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        onUpdateAttendance(cls.id, 'missed');
                      }}
                      className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 font-semibold cursor-pointer"
                    >
                      +1 Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenNotebookForSubject(cls.subject || cls.title)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF0FC] border border-[#121316]/[0.12] text-xs font-semibold text-[#121316] shadow-sm transition-colors cursor-pointer"
                >
                  <NotebookPen className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  <span>Open Class Notebook</span>
                </button>

                {cls.onlineLink && (
                  <a
                    href={cls.onlineLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#EAF0FC] hover:bg-[#DCE7FB] text-xs font-semibold text-[#2F59B8] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Meeting Room</span>
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-[#6E7382] mx-auto" />
          <div>
            <h4 className="font-display text-base font-bold text-[#121316]">No classes created</h4>
            <p className="text-xs text-[#424652] mt-1">
              Add your subjects to view semester attendance statistics and class details.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewClass}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121316] text-[#FAF9F6] text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B8DEF]" />
            <span>Add Class</span>
          </button>
        </div>
      )}
    </div>
  );
}
