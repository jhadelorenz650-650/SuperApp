import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, NotebookPen, Sparkles, X } from 'lucide-react';
import {
  getCoverTheme,
  getFontMeta,
  NOTEBOOK_COVERS,
  NOTEBOOK_FONTS,
  PAPER_STYLES,
  SUBJECT_PRESETS,
} from '../utils/notebookPresets';
import { playPenTapSound } from '../utils/soundEffects';

export function NotebookCreator({
  variant = 'inline', // 'inline' | 'modal'
  onCreateNotebook,
  onClose,
  legacyCount = 0,
  onImportLegacyNotes,
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Discussion');
  const [coverColor, setCoverColor] = useState('indigo');
  const [paperStyle, setPaperStyle] = useState('ruled');
  const [fontStyle, setFontStyle] = useState('handwriting');
  const [nameError, setNameError] = useState(false);

  const selectedCover = getCoverTheme(coverColor);
  const selectedFont = getFontMeta(fontStyle);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    onCreateNotebook({
      name: trimmed,
      subject: subject.trim() || 'General',
      coverColor,
      paperStyle,
      fontStyle,
    });
  };

  const innerContent = (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-center">
      {/* Live Physical Notebook Cover Preview */}
      <div className="flex flex-col items-center justify-center py-2">
        <motion.div
          layout
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-52 sm:w-56 h-72 rounded-r-2xl rounded-l-md bg-gradient-to-br ${selectedCover.coverBg} notebook-cover-shadow overflow-hidden flex flex-col justify-between p-5 select-none`}
        >
          {/* Left Cloth Spine Binding */}
          <div
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-4 ${selectedCover.spineBg} border-r border-black/15`}
          />

          {/* Elastic Band Detailing */}
          <div
            aria-hidden="true"
            className={`absolute inset-y-0 right-3.5 w-2 ${selectedCover.strapBg} opacity-90 shadow-sm`}
          />

          {/* Top Subject Badge */}
          <div className="relative pl-3 flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${selectedCover.badgeBg}`}
            >
              {subject.trim() || 'General'}
            </span>
          </div>

          {/* Middle Stitched Ivory Nameplate */}
          <div className="relative ml-2 mr-3 rounded-xl bg-[#FFFCF5]/95 border border-black/10 p-3.5 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-[#8A8F9E] font-semibold">
              Student Notebook
            </div>
            <div
              className={`mt-1 text-[#24252A] leading-tight line-clamp-2 ${selectedFont.fontClass} ${
                selectedFont.key === 'mono'
                  ? 'text-base font-semibold'
                  : 'text-xl font-bold'
              }`}
            >
              {name.trim() || 'My Study Notebook'}
            </div>
            <div className="mt-2 pt-2 border-t border-[#E6DEC8] flex items-center justify-between text-[10px] text-[#5C6070]">
              <span className="capitalize">{paperStyle} paper</span>
              <span>{selectedFont.label}</span>
            </div>
          </div>

          {/* Bottom Corner Owner Badge */}
          <div className={`relative pl-3 text-[10px] font-medium ${selectedCover.mutedText}`}>
            Jhade · Pulse OS
          </div>
        </motion.div>

        <p className="text-[11px] text-[#8A8F9E] mt-4 text-center">
          Live cover preview · {selectedCover.label}
        </p>
      </div>

      {/* Notebook Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4E51BF] bg-[#4E51BF]/10 px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3 h-3" />
              <span>
                {variant === 'inline'
                  ? 'Step 1 · Set up your first notebook'
                  : 'New Student Notebook'}
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#24252A] tracking-tight">
              Create a Notebook
            </h2>
            <p className="text-xs text-[#5C6070] mt-0.5">
              Give it a title, pick a cover & paper style, and choose your preferred writing font.
            </p>
          </div>

          {variant === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notebook creator"
              className="p-1.5 rounded-xl text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notebook Title */}
        <div>
          <label
            htmlFor="notebook-name-input"
            className="block text-xs font-semibold text-[#24252A] mb-1.5"
          >
            Notebook Name
          </label>
          <input
            id="notebook-name-input"
            type="text"
            autoFocus={variant === 'modal'}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(false);
            }}
            placeholder="e.g. Biology 101, Seminar Discussions, Math Notes..."
            className={`w-full rounded-xl bg-white border px-3.5 py-2.5 text-sm text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none ${
              nameError
                ? 'border-[#E11D48] ring-2 ring-[#FF92A4]/40'
                : 'border-[#24252A]/12 focus:border-[#4E51BF]'
            }`}
          />
          {nameError && (
            <p className="text-[11px] font-medium text-[#9F1239] mt-1">
              Enter a name for your notebook first.
            </p>
          )}
        </div>

        {/* Subject Tag */}
        <div>
          <label
            htmlFor="notebook-subject-input"
            className="block text-xs font-semibold text-[#24252A] mb-1.5"
          >
            Subject / Course
          </label>
          <input
            id="notebook-subject-input"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Course or topic tag"
            className="w-full rounded-xl bg-white border border-[#24252A]/12 px-3.5 py-2 text-xs text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF]"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUBJECT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setSubject(preset);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                  subject === preset
                    ? 'bg-[#4E51BF] border-[#4E51BF] text-white'
                    : 'bg-white/90 border-[#24252A]/10 text-[#5C6070] hover:text-[#24252A]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Cover & Paper Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-semibold text-[#24252A] mb-2">
              Cover Color
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {NOTEBOOK_COVERS.map((c) => {
                const active = coverColor === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      playPenTapSound();
                      setCoverColor(c.key);
                    }}
                    title={c.label}
                    aria-label={c.label}
                    style={{ backgroundColor: c.swatch }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                      active
                        ? 'scale-110 ring-2 ring-[#4E51BF] ring-offset-2'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {active && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          c.key === 'peach' ? 'text-[#24252A]' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#24252A] mb-2">
              Paper Lining
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#24252A]/[0.05]">
              {PAPER_STYLES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    playPenTapSound();
                    setPaperStyle(p.key);
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    paperStyle === p.key
                      ? 'bg-white text-[#24252A] shadow-sm'
                      : 'text-[#5C6070] hover:text-[#24252A]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Font Selector */}
        <div>
          <span className="block text-xs font-semibold text-[#24252A] mb-2">
            Default Writing Font
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NOTEBOOK_FONTS.map((f) => {
              const isSelected = fontStyle === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    playPenTapSound();
                    setFontStyle(f.key);
                  }}
                  className={`text-left rounded-xl border px-3 py-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFE9CE]/75 border-[#4E51BF] shadow-sm'
                      : 'bg-white/90 hover:bg-white border-[#24252A]/10'
                  }`}
                >
                  <div className={`text-sm font-semibold text-[#24252A] truncate ${f.fontClass}`}>
                    {f.label}
                  </div>
                  <div className="text-[10px] text-[#5C6070] truncate">
                    {f.category}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit & Optional Legacy Import */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          {legacyCount > 0 && onImportLegacyNotes ? (
            <button
              type="button"
              onClick={onImportLegacyNotes}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E51BF] hover:text-[#3B3E9E] underline underline-offset-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Import {legacyCount} saved scratchpad page{legacyCount === 1 ? '' : 's'}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {variant === 'modal' && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.05] cursor-pointer"
              >
                Cancel
              </button>
            )}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4E51BF] hover:bg-[#3B3E9E] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm transition-colors cursor-pointer"
            >
              <NotebookPen className="w-4 h-4" />
              <span>Create Notebook</span>
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );

  if (variant === 'modal') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-[#24252A]/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl glass-card rounded-panel p-5 sm:p-7 max-h-[92dvh] overflow-y-auto"
        >
          {innerContent}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-panel p-5 sm:p-8 max-w-4xl mx-auto">
      {innerContent}
    </div>
  );
}
