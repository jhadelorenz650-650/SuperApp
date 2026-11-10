import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { playPenTapSound, playTaskDoneSound } from '../utils/soundEffects';

export function FocusBrainDump({ onAddTaskFromDump }) {
  const [isOpen, setIsOpen] = useState(false);
  const [brainDumpText, setBrainDumpText] = useLocalStorage(
    'superapp_focus_brain_dump_v1',
    ''
  );
  const [addedNotice, setAddedNotice] = useState(false);

  const handleClear = () => {
    playPenTapSound();
    setBrainDumpText('');
  };

  const handleConvertFirstLineToTask = () => {
    const lines = brainDumpText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const first = lines[0].replace(/^[-*•]\s*/, '').trim();
    if (onAddTaskFromDump && first) {
      playTaskDoneSound();
      onAddTaskFromDump(first);
      // Remove first line from scratchpad
      const remaining = lines.slice(1).join('\n');
      setBrainDumpText(remaining);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-[#24252A]/[0.07] overflow-hidden transition-all shadow-sm">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => {
          playPenTapSound();
          setIsOpen((prev) => !prev);
        }}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#FFE9CE]/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFE9CE] flex items-center justify-center shrink-0 text-[#B45309]">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#24252A] block">
              Anti-Distraction Brain Dump Scratchpad
            </span>
            <span className="text-[10px] text-[#8A8F9E]">
              Jot fleeting thoughts down so they don't break your study flow
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#8A8F9E]">
          {brainDumpText.trim() && (
            <span className="w-2 h-2 rounded-full bg-[#4E51BF]" />
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Notepad Area */}
      {isOpen && (
        <div className="p-4 pt-1 space-y-3 bg-[#FFFDF9] border-t border-[#24252A]/[0.05]">
          <textarea
            rows={3}
            value={brainDumpText}
            onChange={(e) => setBrainDumpText(e.target.value)}
            placeholder="e.g. Email prof about lab question, submit problem set 2 on Friday..."
            className="w-full rounded-xl bg-white border border-[#24252A]/[0.08] p-3 text-xs sm:text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF] resize-none"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleClear}
              disabled={!brainDumpText.trim()}
              className="inline-flex items-center gap-1 text-[11px] text-[#8A8F9E] hover:text-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear notepad</span>
            </button>

            {onAddTaskFromDump && brainDumpText.trim() && (
              <button
                type="button"
                onClick={handleConvertFirstLineToTask}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4E51BF]/10 text-[#4E51BF] hover:bg-[#4E51BF]/20 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Added to Tasks!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Save 1st item as Task</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
