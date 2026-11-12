import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  Flame,
  MapPin,
  NotebookPen,
  Radio,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  formatDuration,
  formatTimeRange,
  getClassColor,
  getLiveClassStatus,
  minutesToTime,
  timeToMinutes,
} from '../utils/timetablePresets';
import { playLiquidWaveSound, playPenTapSound } from '../utils/soundEffects';

export function TimetableLiveRadar({
  classes = [],
  onOpenClass,
  onOpenNotebookForSubject,
}) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Tick every 10 seconds for real-time progress and minute accuracy
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const live = getLiveClassStatus(classes, now);
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Handle opening focus mode
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

  return (
    <div className="glass-card rounded-panel p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle 10% Cornflower ambient corner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-[#5B8DEF]/10 rounded-full blur-2xl"
      />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Live indicator and time */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#121316] shrink-0 text-[#FAF9F6]">
            <Radio className="w-5 h-5 text-[#5B8DEF]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B8DEF] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5B8DEF]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF0FC] text-[#2F59B8] border border-[#5B8DEF]/30">
                Live Schedule Radar
              </span>
              <span className="text-xs font-semibold text-[#6E7382]">
                {dayName}, {dateFormatted}
              </span>
            </div>
            <div className="font-display text-lg sm:text-xl font-bold text-[#121316] mt-0.5 flex items-center gap-2 tabular-nums">
              <span>{timeFormatted}</span>
              <span className="text-xs font-normal text-[#424652]">
                ({live.todayClassesCount} class{live.todayClassesCount === 1 ? '' : 'es'} today)
              </span>
            </div>
          </div>
        </div>

        {/* Right Status Capsule */}
        <div className="w-full md:w-auto">
          {/* CASE 1: In class right now */}
          {live.status === 'in_class' && live.activeClass && (
            <div className="rounded-2xl bg-[#EAF0FC]/65 border border-[#5B8DEF]/35 p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3762C4] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    IN PROGRESS
                  </span>
                  <span className="text-xs font-bold text-[#121316] truncate">
                    {live.activeClass.courseCode}: {live.activeClass.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#424652] mt-1 tabular-nums">
                  <span>{formatTimeRange(live.activeClass.startTime, live.activeClass.endTime)}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#2F59B8]">
                    {live.remainingMinutes} min{live.remainingMinutes === 1 ? '' : 's'} remaining
                  </span>
                  {live.activeClass.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#121316]">
                        <MapPin className="w-3 h-3 text-[#5B8DEF]" />
                        {live.activeClass.location}
                      </span>
                    </>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-[#121316]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5B8DEF] rounded-full transition-all duration-1000"
                    style={{ width: `${live.progress}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {live.activeClass.onlineLink && (
                  <a
                    href={live.activeClass.onlineLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-[#2F59B8] hover:bg-[#EAF0FC] border border-[#121316]/[0.12] shadow-sm transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Join Class</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onOpenNotebookForSubject(live.activeClass.subject || live.activeClass.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121316] text-xs font-semibold text-[#FAF9F6] hover:bg-[#23252C] shadow-sm transition-colors cursor-pointer"
                >
                  <NotebookPen className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  <span>Open Notebook</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: Upcoming class today */}
          {live.status === 'before_class' && live.nextClass && (
            <div className="rounded-2xl bg-white border border-[#121316]/[0.14] p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#121316] text-[#FAF9F6]">
                    UP NEXT
                  </span>
                  <span className="text-xs font-bold text-[#121316] truncate">
                    {live.nextClass.courseCode ? `${live.nextClass.courseCode}: ` : ''}
                    {live.nextClass.title}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-[#424652] mt-1 tabular-nums">
                  <span className="font-semibold text-[#2F59B8]">
                    Starts in {live.minutesUntil > 60 ? `${Math.floor(live.minutesUntil / 60)}h ${live.minutesUntil % 60}m` : `${live.minutesUntil} mins`}
                  </span>
                  <span>•</span>
                  <span>{minutesToTime(timeToMinutes(live.nextClass.startTime))}</span>
                  {live.nextClass.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#5B8DEF]" />
                        {live.nextClass.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {live.minutesUntil >= 25 && (
                  <button
                    type="button"
                    onClick={() => handleStartFocus(live.nextClass.subject)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF9F6] text-xs font-semibold text-[#121316] hover:bg-[#EAF0FC] border border-[#121316]/[0.12] shadow-sm transition-colors cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5 text-[#5B8DEF]" />
                    <span>Quick Study Prep</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenClass(live.nextClass)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#121316] text-xs font-semibold text-[#FAF9F6] hover:bg-[#23252C] shadow-sm transition-colors cursor-pointer"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5B8DEF]" />
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: Classes finished today */}
          {live.status === 'classes_finished' && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">All done for today. </span>
                <span>You completed all {live.todayClassesCount} scheduled sessions for {dayName}.</span>
              </div>
            </div>
          )}

          {/* CASE 4: No classes scheduled today */}
          {live.status === 'no_classes_today' && (
            <div className="rounded-2xl bg-white border border-[#121316]/[0.1] p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 text-xs text-[#424652]">
              <Coffee className="w-5 h-5 text-[#6E7382] shrink-0" />
              <div>
                <span className="font-semibold text-[#121316]">No classes on {dayName}. </span>
                <span>Enjoy your break, get ahead on assignments, or schedule a study block.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
