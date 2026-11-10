import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  ExternalLink,
  MapPin,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  formatDuration,
  formatTimeRange,
  getClassColor,
  minutesToTime,
  timeToMinutes,
} from '../utils/timetablePresets';
import { playPenTapSound } from '../utils/soundEffects';

const HOUR_HEIGHT = 64; // px per hour
const DEFAULT_START_HOUR = 8;  // 8:00 AM
const DEFAULT_END_HOUR = 19;   // 7:00 PM

export function TimetableWeeklyGrid({
  classes = [],
  includeWeekends = false,
  onOpenClass,
  onOpenNotebookForSubject,
}) {
  const [hoveredClassId, setHoveredClassId] = useState(null);

  const displayedDays = useMemo(() => {
    if (includeWeekends) {
      return DAYS_OF_WEEK; // Mon - Sun
    }
    return DAYS_OF_WEEK.filter((d) => d.index >= 1 && d.index <= 5); // Mon - Fri
  }, [includeWeekends]);

  // Compute dynamic start and end hours to accommodate early morning or late evening classes
  const { startHour, endHour } = useMemo(() => {
    let minH = DEFAULT_START_HOUR;
    let maxH = DEFAULT_END_HOUR;
    classes.forEach((c) => {
      if (c.startTime) {
        const s = Math.floor(timeToMinutes(c.startTime) / 60);
        if (s < minH) minH = Math.max(6, s);
      }
      if (c.endTime) {
        const e = Math.ceil(timeToMinutes(c.endTime) / 60);
        if (e > maxH) maxH = Math.min(23, e);
      }
    });
    return { startHour: minH, endHour: maxH };
  }, [classes]);

  // Determine today's day index (0 = Sun, 1 = Mon ... 6 = Sat)
  const todayIndex = new Date().getDay();
  const currentNow = new Date();
  const currentMinutes = currentNow.getHours() * 60 + currentNow.getMinutes();
  const startDayMinutes = startHour * 60;
  const endDayMinutes = endHour * 60;

  // Generate hourly rows from startHour to endHour
  const hours = useMemo(() => {
    const list = [];
    for (let h = startHour; h <= endHour; h += 1) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  // Compute position for current time line
  const currentTimeTop = useMemo(() => {
    if (currentMinutes < startDayMinutes || currentMinutes > endDayMinutes) return null;
    return ((currentMinutes - startDayMinutes) / 60) * HOUR_HEIGHT;
  }, [currentMinutes, startDayMinutes, endDayMinutes]);

  return (
    <div className="glass-card rounded-panel overflow-hidden border border-[#24252A]/[0.08] shadow-sm">
      {/* Scrollable Container for small screens */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Header Row: Days of Week */}
          <div className="grid grid-cols-[64px_repeat(auto-fit,minmax(0,1fr))] border-b border-[#24252A]/[0.08] bg-[#F8F9FA]/80 sticky top-0 z-20 backdrop-blur-md">
            {/* Corner Cell */}
            <div className="p-3 text-[11px] font-semibold text-[#8A8F9E] text-center border-r border-[#24252A]/[0.06]">
              Time
            </div>

            {/* Day Columns Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${displayedDays.length}, minmax(0, 1fr))`,
              }}
            >
              {displayedDays.map((day) => {
                const isToday = day.index === todayIndex;
                const countToday = classes.filter((c) => (c.days || []).includes(day.index)).length;

                return (
                  <div
                    key={day.index}
                    className={`py-3 px-2 text-center border-r last:border-r-0 border-[#24252A]/[0.06] transition-colors ${
                      isToday ? 'bg-[#FFE9CE]/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isToday ? 'text-[#4E51BF]' : 'text-[#24252A]'
                        }`}
                      >
                        {day.short}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4E51BF]" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#8A8F9E] mt-0.5">
                      {countToday} {countToday === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Canvas */}
          <div className="relative grid grid-cols-[64px_1fr]">
            {/* Time Column (Left labels) */}
            <div className="relative border-r border-[#24252A]/[0.06] bg-[#FDFEFE] select-none">
              {hours.map((hour) => {
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayH = hour % 12 === 0 ? 12 : hour % 12;
                return (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="relative border-b border-[#24252A]/[0.05] text-[10px] font-medium text-[#8A8F9E] pr-2 pt-1 text-right"
                  >
                    {displayH} {period}
                  </div>
                );
              })}
            </div>

            {/* Days Grid Body */}
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${displayedDays.length}, minmax(0, 1fr))`,
              }}
            >
              {/* Background Horizontal Guide Lines */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none flex flex-col"
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-[#24252A]/[0.05] w-full"
                  />
                ))}
              </div>

              {/* Day Columns */}
              {displayedDays.map((day) => {
                const isToday = day.index === todayIndex;
                const dayClasses = classes.filter((c) => (c.days || []).includes(day.index));

                return (
                  <div
                    key={day.index}
                    className={`relative border-r last:border-r-0 border-[#24252A]/[0.06] ${
                      isToday ? 'bg-[#FFE9CE]/[0.15]' : ''
                    }`}
                    style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Real-time Indicator Line if today */}
                    {isToday && currentTimeTop !== null && (
                      <div
                        style={{ top: `${currentTimeTop}px` }}
                        className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                      >
                        <span className="w-2.5 h-2.5 -ml-1.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm" />
                        <div className="h-0.5 w-full bg-rose-500 shadow-sm" />
                      </div>
                    )}

                    {/* Classes in this Day Column */}
                    {dayClasses.map((cls) => {
                      const theme = getClassColor(cls.colorTheme);
                      const startMin = timeToMinutes(cls.startTime);
                      const endMin = timeToMinutes(cls.endTime);

                      // Calculate top and height
                      const topPx = Math.max(0, ((startMin - startDayMinutes) / 60) * HOUR_HEIGHT);
                      const heightPx = Math.max(34, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4);
                      const isHovered = hoveredClassId === cls.id;

                      return (
                        <motion.div
                          key={`${cls.id}-${day.index}`}
                          whileHover={{ scale: 1.015, zIndex: 25 }}
                          onMouseEnter={() => setHoveredClassId(cls.id)}
                          onMouseLeave={() => setHoveredClassId(null)}
                          onClick={() => {
                            playPenTapSound();
                            onOpenClass(cls);
                          }}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                          }}
                          className={`absolute inset-x-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-shadow shadow-sm ${
                            theme.bannerBg
                          } ${theme.border} ${
                            isHovered ? 'shadow-md ring-2 ring-[#4E51BF]/40' : ''
                          }`}
                        >
                          {/* Top Pill / Code */}
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${theme.lightBg} ${theme.text} truncate`}
                              >
                                {cls.courseCode || cls.subject}
                              </span>
                              <span className="text-[9px] font-medium text-[#5C6070] shrink-0">
                                {cls.startTime}
                              </span>
                            </div>
                            <div
                              className={`font-semibold text-xs leading-snug line-clamp-2 mt-1 ${theme.darkText}`}
                            >
                              {cls.title}
                            </div>
                          </div>

                          {/* Bottom metadata (only if height allows) */}
                          {heightPx > 50 && (
                            <div className="flex items-center justify-between gap-1 text-[10px] text-[#5C6070] pt-1 mt-auto border-t border-black/[0.04]">
                              {cls.location ? (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-2.5 h-2.5 text-[#8A8F9E] shrink-0" />
                                  <span className="truncate">{cls.location}</span>
                                </span>
                              ) : (
                                <span className="capitalize text-[10px] text-[#8A8F9E]">
                                  {cls.type || 'Lecture'}
                                </span>
                              )}
                              <span className="font-semibold text-[9px] shrink-0">
                                {formatDuration(cls.startTime, cls.endTime)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
