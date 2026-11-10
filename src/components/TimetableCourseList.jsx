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
        <div className="glass-card rounded-2xl p-4 border border-[#24252A]/[0.07]">
          <div className="text-[11px] font-semibold text-[#8A8F9E] uppercase tracking-wider">
            Total Courses
          </div>
          <div className="font-display text-2xl font-bold text-[#24252A] mt-1">
            {stats.totalCourses}
          </div>
          <div className="text-[11px] text-[#5C6070] mt-0.5">Active this semester</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-[#24252A]/[0.07]">
          <div className="text-[11px] font-semibold text-[#8A8F9E] uppercase tracking-wider">
            Weekly Class Load
          </div>
          <div className="font-display text-2xl font-bold text-[#4E51BF] mt-1">
            {stats.weeklyHours}h
          </div>
          <div className="text-[11px] text-[#5C6070] mt-0.5">In lecture & labs</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-[#24252A]/[0.07]">
          <div className="text-[11px] font-semibold text-[#8A8F9E] uppercase tracking-wider">
            Attendance Rate
          </div>
          <div className="font-display text-2xl font-bold text-emerald-600 mt-1">
            {stats.overallPct}%
          </div>
          <div className="text-[11px] text-[#5C6070] mt-0.5">
            {stats.totalAttended} / {stats.totalSessions} sessions
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-[#24252A]/[0.07]">
          <div className="text-[11px] font-semibold text-[#8A8F9E] uppercase tracking-wider">
            Total Absences
          </div>
          <div className="font-display text-2xl font-bold text-rose-500 mt-1">
            {stats.totalMissed}
          </div>
          <div className="text-[11px] text-[#5C6070] mt-0.5">Across all subjects</div>
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
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#24252A]/[0.05] text-[#5C6070] capitalize">
                      {cls.type || 'Lecture'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenClass(cls)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-[#24252A]/[0.06] text-[#24252A] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTaskDeleteSound();
                        onDeleteClass(cls.id);
                      }}
                      className="p-1 rounded-lg text-[#8A8F9E] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  onClick={() => onOpenClass(cls)}
                  className="font-display text-base sm:text-lg font-bold text-[#24252A] mt-2 hover:text-[#4E51BF] transition-colors cursor-pointer"
                >
                  {cls.title}
                </h3>
                <div className="text-xs text-[#5C6070] mt-0.5">{cls.subject}</div>

                {cls.instructor && (
                  <div className="flex items-center gap-1.5 text-xs text-[#5C6070] mt-2">
                    <User className="w-3.5 h-3.5 text-[#8A8F9E]" />
                    <span>{cls.instructor}</span>
                  </div>
                )}

                {/* Schedule and Location */}
                <div className="mt-3 pt-3 border-t border-[#24252A]/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6070]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#4E51BF]" />
                    <span className="font-semibold text-[#24252A]">{daysStr}</span>
                    <span>•</span>
                    <span>{formatTimeRange(cls.startTime, cls.endTime)}</span>
                  </div>

                  {cls.location && (
                    <div className="flex items-center gap-1 text-[#24252A]">
                      <MapPin className="w-3.5 h-3.5 text-[#8A8F9E]" />
                      <span>{cls.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Tracking Box */}
              <div className="rounded-xl bg-[#F8F9FA] p-3.5 border border-[#24252A]/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#24252A]">
                    <span>Attendance Standing:</span>
                    <span className={isAboveTarget ? 'text-emerald-700' : 'text-rose-600'}>
                      {coursePct}%
                    </span>
                    <span className="text-[10px] font-normal text-[#8A8F9E]">
                      (target {target}%)
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#24252A]">
                    {att.attended} Attended • {att.missed} Missed
                  </div>
                </div>

                {/* Attendance Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#24252A]/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveTarget ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, coursePct)}%` }}
                  />
                </div>

                {/* Attendance Policy / Cut Advisory */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5C6070]">
                    {isAboveTarget ? (
                      totalCourseSessions === 0 ? (
                        'No sessions recorded yet'
                      ) : safeCuts === 0 ? (
                        `⚠️ On target threshold: any missed class will drop below ${target}%`
                      ) : (
                        `✓ Safe to miss ~${safeCuts} more class${safeCuts === 1 ? '' : 'es'} without dropping below ${target}%`
                      )
                    ) : (
                      `⚠️ Below attendance threshold! Attend upcoming classes.`
                    )}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playTaskDoneSound();
                        onUpdateAttendance(cls.id, 'attended');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer"
                    >
                      +1 Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        onUpdateAttendance(cls.id, 'missed');
                      }}
                      className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
                >
                  <NotebookPen className="w-3.5 h-3.5 text-[#4E51BF]" />
                  <span>Open Class Notebook</span>
                </button>

                {cls.onlineLink && (
                  <a
                    href={cls.onlineLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#4E51BF]/10 hover:bg-[#4E51BF]/20 text-xs font-semibold text-[#4E51BF] transition-colors"
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
          <BookOpen className="w-10 h-10 text-[#8A8F9E] mx-auto" />
          <div>
            <h4 className="font-display text-base font-bold text-[#24252A]">No classes created</h4>
            <p className="text-xs text-[#5C6070] mt-1">
              Add your subjects to view semester attendance statistics and class details.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewClass}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4E51BF] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class</span>
          </button>
        </div>
      )}
    </div>
  );
}
