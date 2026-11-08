import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { getTodayInputString } from '../utils/taskDates';

const PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    activeClass: 'bg-[#4E51BF]/12 text-[#4E51BF] border-[#4E51BF]/35',
  },
  {
    value: 'medium',
    label: 'Medium',
    activeClass: 'bg-[#FFE9CE] text-[#8A530D] border-[#F2C38B]',
  },
  {
    value: 'high',
    label: 'High',
    activeClass: 'bg-[#FF92A4]/25 text-[#9F1239] border-[#FF92A4]/50',
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
      className="bg-white rounded-panel border border-[#24252A]/[0.08] p-5 sm:p-6 space-y-4 shadow-2xl shadow-[#24252A]/15"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-[#24252A] tracking-tight">
            New Assignment
          </h2>
          <p className="text-xs text-[#5C6070] mt-0.5">
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
            className="p-1.5 rounded-lg text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="space-y-3.5">
        <div>
          <label htmlFor="task-title" className="block text-xs font-medium text-[#24252A] mb-1.5">
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
            className="w-full rounded-xl bg-[#F4F5FA] border border-[#24252A]/[0.1] px-3.5 py-2.5 text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-subject" className="block text-xs font-medium text-[#24252A] mb-1.5">
              Subject
            </label>
            <input
              id="task-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. MATH 201"
              className="w-full rounded-xl bg-[#F4F5FA] border border-[#24252A]/[0.1] px-3.5 py-2.5 text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label htmlFor="task-due" className="block text-xs font-medium text-[#24252A] mb-1.5">
              Due Date
            </label>
            <input
              id="task-due"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl bg-[#F4F5FA] border border-[#24252A]/[0.1] px-3.5 py-2.5 text-sm text-[#24252A] focus:outline-none focus:border-[#4E51BF] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-[#24252A] mb-1.5">
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
                      : 'bg-[#F4F5FA] text-[#5C6070] border-[#24252A]/[0.08] hover:text-[#24252A] hover:bg-[#ECEEF7]'
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
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#24252A] hover:bg-[#33353D] text-white text-sm font-semibold py-2.5 px-4 shadow-sm transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </motion.button>
    </motion.form>
  );
}
