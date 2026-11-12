import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { getTodayInputString } from '../utils/taskDates';

const PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    activeClass: 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/45',
  },
  {
    value: 'medium',
    label: 'Medium',
    activeClass: 'bg-[#ECE9E1] text-[#121316] border-[#121316]/30',
  },
  {
    value: 'high',
    label: 'High',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300',
  },
];

export function TaskForm({ onAddTask, onClose }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(() => getTodayInputString());
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onAddTask({
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      subject: subject.trim() || 'General',
      dueDate: dueDate || getTodayInputString(),
      priority,
      completed: false,
      createdAt: Date.now(),
    });

    setTitle('');
    setSubject('');
    setDueDate(getTodayInputString());
    setPriority('medium');
    if (onClose) onClose();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FAF9F6] rounded-panel border border-[#121316]/[0.14] p-5 sm:p-6 space-y-4 shadow-2xl shadow-[#121316]/20"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="task-modal-title"
            className="font-display text-base font-semibold text-[#121316] tracking-tight"
          >
            New Assignment
          </h2>
          <p className="text-xs text-[#424652] mt-0.5">
            Track deadlines with live countdowns
          </p>
        </div>
        {onClose && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Close form"
            className="p-1.5 rounded-lg text-[#424652] hover:text-[#121316] hover:bg-[#121316]/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="space-y-3.5">
        <div>
          <label htmlFor="task-title" className="block text-xs font-medium text-[#121316] mb-1.5">
            Title
          </label>
          <input
            id="task-title"
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Linear Algebra Problem Set 4"
            className="w-full rounded-xl bg-white border border-[#121316]/[0.12] px-3.5 py-2.5 text-sm text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-subject" className="block text-xs font-medium text-[#121316] mb-1.5">
              Subject
            </label>
            <input
              id="task-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. MATH 201"
              className="w-full rounded-xl bg-white border border-[#121316]/[0.12] px-3.5 py-2.5 text-sm text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="task-due" className="block text-xs font-medium text-[#121316] mb-1.5">
              Due Date
            </label>
            <input
              id="task-due"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#121316]/[0.12] px-3.5 py-2.5 text-sm text-[#121316] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-[#121316] mb-1.5">
            Priority
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((item) => {
              const selected = priority === item.value;
              return (
                <motion.button
                  key={item.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPriority(item.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    selected
                      ? item.activeClass
                      : 'bg-white text-[#424652] border-[#121316]/[0.1] hover:text-[#121316] hover:bg-[#ECE9E1]/60'
                  }`}
                >
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#121316] hover:bg-[#23252C] text-[#FAF9F6] text-sm font-semibold py-2.5 px-4 shadow-sm transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4 text-[#5B8DEF]" />
        Add Task
      </motion.button>
    </motion.form>
  );
}
