export const LINE_HEIGHT = 32;
export const MIN_PAGE_HEIGHT = LINE_HEIGHT * 22; // 704px (22 ruled lines)

export const NOTEBOOK_FONTS = [
  {
    key: 'handwriting',
    label: 'Caveat',
    category: 'Cursive Pen',
    preview: 'Quick seminar notes & arrows',
    fontClass: 'font-nb-caveat',
    bodyClass: 'font-nb-caveat text-[22px] sm:text-[24px] font-medium',
    titleClass: 'font-nb-caveat text-3xl sm:text-4xl font-bold tracking-wide',
  },
  {
    key: 'neat-pen',
    label: 'Patrick Hand',
    category: 'Neat Print',
    preview: 'Clean student notebook ink',
    fontClass: 'font-nb-patrick',
    bodyClass: 'font-nb-patrick text-[19px] sm:text-[20px] font-normal tracking-[0.01em]',
    titleClass: 'font-nb-patrick text-2xl sm:text-3xl font-normal tracking-wide',
  },
  {
    key: 'journal',
    label: 'Kalam',
    category: 'Marker Script',
    preview: 'Warm expressive discussion notes',
    fontClass: 'font-nb-kalam',
    bodyClass: 'font-nb-kalam text-[17px] sm:text-[18px] font-normal',
    titleClass: 'font-nb-kalam text-2xl sm:text-3xl font-bold',
  },
  {
    key: 'serif',
    label: 'Lora',
    category: 'Editorial Serif',
    preview: 'Classic reading & essay outlines',
    fontClass: 'font-nb-lora',
    bodyClass: 'font-nb-lora text-[16px] sm:text-[16.5px] font-normal',
    titleClass: 'font-nb-lora text-2xl sm:text-3xl font-semibold tracking-tight',
  },
  {
    key: 'print',
    label: 'Inter',
    category: 'Modern Sans',
    preview: 'Crisp structured bullet lists',
    fontClass: 'font-nb-inter',
    bodyClass: 'font-nb-inter text-[15px] sm:text-[15.5px] font-normal',
    titleClass: 'font-display text-xl sm:text-2xl font-bold tracking-tight',
  },
  {
    key: 'mono',
    label: 'JetBrains Mono',
    category: 'Code & Formulas',
    preview: 'fn digest(topic) => keyPoints',
    fontClass: 'font-nb-mono',
    bodyClass: 'font-nb-mono text-[13.5px] sm:text-[14px] font-normal',
    titleClass: 'font-nb-mono text-lg sm:text-xl font-semibold tracking-tight',
  },
];

export function getFontMeta(fontKey) {
  return (
    NOTEBOOK_FONTS.find((f) => f.key === fontKey) || NOTEBOOK_FONTS[0]
  );
}

export const NOTEBOOK_COVERS = [
  {
    key: 'indigo',
    label: 'Cobalt Classic',
    coverBg: 'from-[#4E51BF] via-[#4548B4] to-[#373A9B]',
    spineBg: 'bg-[#2B2D7A]',
    swatch: '#4E51BF',
    strapBg: 'bg-[#FFE9CE]',
    labelText: 'text-white',
    mutedText: 'text-indigo-100/85',
    badgeBg: 'bg-white/16 text-white border-white/25',
  },
  {
    key: 'coral',
    label: 'Coral Blush',
    coverBg: 'from-[#FF92A4] via-[#F4728A] to-[#DC4E6D]',
    spineBg: 'bg-[#AF3150]',
    swatch: '#F4728A',
    strapBg: 'bg-[#FFE9CE]',
    labelText: 'text-white',
    mutedText: 'text-rose-50/90',
    badgeBg: 'bg-white/20 text-white border-white/30',
  },
  {
    key: 'peach',
    label: 'Warm Kraft',
    coverBg: 'from-[#FFE9CE] via-[#F7D7B0] to-[#EAC08E]',
    spineBg: 'bg-[#C4823E]',
    swatch: '#F3C794',
    strapBg: 'bg-[#24252A]',
    labelText: 'text-[#24252A]',
    mutedText: 'text-[#5C4630]',
    badgeBg: 'bg-[#24252A]/10 text-[#24252A] border-[#24252A]/15',
  },
  {
    key: 'sage',
    label: 'Forest Mint',
    coverBg: 'from-[#14968A] via-[#0F766E] to-[#0B5B55]',
    spineBg: 'bg-[#084440]',
    swatch: '#0F766E',
    strapBg: 'bg-[#FFE9CE]',
    labelText: 'text-white',
    mutedText: 'text-teal-50/85',
    badgeBg: 'bg-white/16 text-white border-white/25',
  },
  {
    key: 'charcoal',
    label: 'Matte Ink',
    coverBg: 'from-[#2D2F36] via-[#24252A] to-[#17181C]',
    spineBg: 'bg-[#101114]',
    swatch: '#24252A',
    strapBg: 'bg-[#FF92A4]',
    labelText: 'text-white',
    mutedText: 'text-zinc-300',
    badgeBg: 'bg-white/14 text-white border-white/20',
  },
  {
    key: 'plum',
    label: 'Violet Study',
    coverBg: 'from-[#7C4DFF] via-[#6538D8] to-[#4E28B3]',
    spineBg: 'bg-[#3C1C8E]',
    swatch: '#6538D8',
    strapBg: 'bg-[#FFE9CE]',
    labelText: 'text-white',
    mutedText: 'text-violet-100/85',
    badgeBg: 'bg-white/16 text-white border-white/25',
  },
];

export function getCoverTheme(coverKey) {
  return (
    NOTEBOOK_COVERS.find((c) => c.key === coverKey) || NOTEBOOK_COVERS[0]
  );
}

export const PAPER_STYLES = [
  { key: 'ruled', label: 'Ruled' },
  { key: 'grid', label: 'Grid' },
  { key: 'dots', label: 'Dots' },
  { key: 'blank', label: 'Plain' },
];

export const SUBJECT_PRESETS = [
  'Discussion',
  'Lecture',
  'Science',
  'Math',
  'Reading',
  'CS / Lab',
];

export function getPaperBackgroundStyle(paperStyle) {
  if (paperStyle === 'grid') {
    return {
      backgroundImage:
        'linear-gradient(to right, rgba(78, 81, 191, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(78, 81, 191, 0.14) 1px, transparent 1px)',
      backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
      backgroundPosition: '0 0',
    };
  }
  if (paperStyle === 'dots') {
    return {
      backgroundImage:
        'radial-gradient(rgba(78, 81, 191, 0.28) 1.25px, transparent 1.25px)',
      backgroundSize: `24px ${LINE_HEIGHT}px`,
      backgroundPosition: '12px 26px',
    };
  }
  if (paperStyle === 'blank') {
    return {};
  }
  return {
    backgroundImage:
      'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(78, 81, 191, 0.16) 31px, rgba(78, 81, 191, 0.16) 32px)',
    backgroundPosition: '0 0',
  };
}

export function createBlankPage({
  subject = 'Discussion',
  paperStyle = 'ruled',
  fontStyle = 'handwriting',
  title = 'Page 1 — Discussion Notes',
} = {}) {
  const now = Date.now();
  return {
    id: `note-${now}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    subject,
    paperStyle,
    fontStyle,
    textInkColor: '#24252A',
    bookmarked: false,
    content: '',
    strokes: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function formatNoteTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay) return `Today · ${timeStr}`;
  const dayStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${dayStr} · ${timeStr}`;
}
