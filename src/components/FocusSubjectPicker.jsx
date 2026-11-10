import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  NotebookPen,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react';
import { playPageTurnSound, playPenTapSound } from '../utils/soundEffects';

export function FocusSubjectPicker({
  selectedSubject,
  onSelectSubject,
  selectedTask,
  onSelectTask,
  onOpenNotebookForSubject,
}) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Read tasks and timetable from localStorage
  useEffect(() => {
    try {
      const rawTasks = window.localStorage.getItem('superapp_tasks_v1');
      if (rawTasks) setTasks(JSON.parse(rawTasks) || []);

      const rawClasses = window.localStorage.getItem('superapp_timetable_v1');
      if (rawClasses) setClasses(JSON.parse(rawClasses) || []);
    } catch {
      // Ignore
    }
  }, []);

  // Distinct subjects from timetable and tasks
  const availableSubjects = useMemo(() => {
    const set = new Set();
    classes.forEach((c) => {
      if (c.subject) set.add(c.subject.trim());
      else if (c.title) set.add(c.title.trim());
    });
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject.trim());
    });
    // Default standard subjects if empty
    if (set.size === 0) {
      ['Computer Science', 'Mathematics', 'Physics', 'General Study'].forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [classes, tasks]);

  // Uncompleted tasks
  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed);
  }, [tasks]);

  return (
    <div className="glass-card rounded-2xl p-4 border border-[#24252A]/[0.07] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Current Target Subject Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE9CE] flex items-center justify-center shrink-0 text-[#4E51BF]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8F9E] block">
              Current Focus Target
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display text-sm sm:text-base font-bold text-[#24252A]">
                {selectedSubject || 'General Deep Study'}
              </span>
              {selectedTask && (
                <span className="text-xs text-[#5C6070] truncate max-w-[200px]">
                  • {selectedTask.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick actions (Change Subject / Open Notebook) */}
        <div className="flex items-center gap-2">
          {/* Change subject picker dropdown button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playPenTapSound();
                setIsOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#4E51BF]" />
              <span>Change Subject</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8F9E]" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#24252A]/10 shadow-xl p-2 z-50 max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8F9E]">
                  Registered Subjects
                </div>
                <div className="space-y-0.5 mb-2">
                  {availableSubjects.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        playPenTapSound();
                        onSelectSubject(sub);
                        onSelectTask(null);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                        selectedSubject === sub
                          ? 'bg-[#FFE9CE] text-[#5C4630]'
                          : 'hover:bg-[#F4F5FB] text-[#24252A]'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {selectedSubject === sub && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4E51BF]" />
                      )}
                    </button>
                  ))}
                </div>

                {pendingTasks.length > 0 && (
                  <>
                    <div className="px-2 py-1 pt-2 border-t border-[#24252A]/[0.06] text-[10px] font-bold uppercase tracking-wider text-[#8A8F9E]">
                      Link to an Assignment
                    </div>
                    <div className="space-y-0.5">
                      {pendingTasks.slice(0, 5).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            playPenTapSound();
                            onSelectTask(task);
                            if (task.subject) onSelectSubject(task.subject);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            selectedTask?.id === task.id
                              ? 'bg-[#FFE9CE] text-[#5C4630] font-semibold'
                              : 'hover:bg-[#F4F5FB] text-[#5C6070]'
                          }`}
                        >
                          <div className="truncate font-medium text-[#24252A]">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-[#8A8F9E] truncate">
                            {task.subject || 'General'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 1-Click Class Notebook Launcher */}
          <button
            type="button"
            onClick={() => onOpenNotebookForSubject(selectedSubject)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
          >
            <NotebookPen className="w-3.5 h-3.5 text-[#4E51BF]" />
            <span className="hidden sm:inline">Open Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
