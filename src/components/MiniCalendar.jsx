import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthCalendarDays, toDateInputString } from '../utils/taskDates';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MiniCalendar({ tasks }) {
  const today = new Date();
  const todayKey = toDateInputString(today);
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const cells = useMemo(
    () => getMonthCalendarDays(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  const dueMap = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.completed && t.dueDate) {
        map[t.dueDate] = (map[t.dueDate] || 0) + 1;
      }
    });
    return map;
  }, [tasks]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' }
  );

  const shiftMonth = (delta) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="glass-card rounded-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-[#24252A]">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="p-1.5 rounded-lg text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="p-1.5 rounded-lg text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS.map((day, idx) => (
          <div key={idx} className="text-[10px] font-semibold text-[#8A8F9E] py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }
          const isToday = cell.dateKey === todayKey;
          const dueCount = dueMap[cell.dateKey] || 0;

          return (
            <div
              key={cell.dateKey}
              title={
                dueCount > 0
                  ? `${dueCount} active task${dueCount > 1 ? 's' : ''} due`
                  : undefined
              }
              className={`relative h-8 rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                isToday
                  ? 'bg-[#4E51BF] text-white font-bold shadow-sm'
                  : dueCount > 0
                    ? 'bg-[#FFE9CE]/75 text-[#24252A] font-semibold border border-[#F3D1A7]'
                    : 'text-[#5C6070] hover:bg-[#24252A]/[0.05]'
              }`}
            >
              <span>{cell.day}</span>
              {dueCount > 0 && !isToday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#FF92A4]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
