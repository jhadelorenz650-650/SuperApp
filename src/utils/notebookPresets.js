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
    label: 'Cornflower Classic',
    coverBg: 'from-[#5B8DEF] via-[#3762C4] to-[#284B9E]',
    spineBg: 'bg-[#121316]',
    swatch: '#3762C4',
    strapBg: 'bg-[#F5F3EE]',
    labelText: 'text-white',
    mutedText: 'text-[#EAF0FC]/85',
    badgeBg: 'bg-white/16 text-white border-white/25',
  },
  {
    key: 'coral',
    label: 'Coral Blush',
    coverBg: 'from-[#FF92A4] via-[#F4728A] to-[#DC4E6D]',
    spineBg: 'bg-[#AF3150]',
    swatch: '#F4728A',
    strapBg: 'bg-[#F5F3EE]',
    labelText: 'text-white',
    mutedText: 'text-rose-50/90',
    badgeBg: 'bg-white/20 text-white border-white/30',
  },
  {
    key: 'peach',
    label: 'Archival Kraft',
    coverBg: 'from-[#F5F3EE] via-[#ECE9E1] to-[#DED9CE]',
    spineBg: 'bg-[#121316]',
    swatch: '#ECE9E1',
    strapBg: 'bg-[#5B8DEF]',
    labelText: 'text-[#121316]',
    mutedText: 'text-[#424652]',
    badgeBg: 'bg-[#121316]/[0.08] text-[#121316] border-[#121316]/15',
  },
  {
    key: 'sage',
    label: 'Forest Mint',
    coverBg: 'from-[#14968A] via-[#0F766E] to-[#0B5B55]',
    spineBg: 'bg-[#084440]',
    swatch: '#0F766E',
    strapBg: 'bg-[#F5F3EE]',
    labelText: 'text-white',
    mutedText: 'text-teal-50/85',
    badgeBg: 'bg-white/16 text-white border-white/25',
  },
  {
    key: 'charcoal',
    label: 'Ink Black',
    coverBg: 'from-[#1D1F25] via-[#121316] to-[#0A0B0D]',
    spineBg: 'bg-[#000000]',
    swatch: '#121316',
    strapBg: 'bg-[#5B8DEF]',
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
    strapBg: 'bg-[#F5F3EE]',
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
        'linear-gradient(to right, rgba(91, 141, 239, 0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(91, 141, 239, 0.14) 1px, transparent 1px)',
      backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
      backgroundPosition: '0 0',
    };
  }
  if (paperStyle === 'dots') {
    return {
      backgroundImage:
        'radial-gradient(rgba(91, 141, 239, 0.30) 1.25px, transparent 1.25px)',
      backgroundSize: `24px ${LINE_HEIGHT}px`,
      backgroundPosition: '12px 26px',
    };
  }
  if (paperStyle === 'blank') {
    return {};
  }
  return {
    backgroundImage:
      'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(91, 141, 239, 0.18) 31px, rgba(91, 141, 239, 0.18) 32px)',
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
    textInkColor: '#121316',
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
