export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    stripClass: 'bg-[#B9B5AC]',
    badgeClass: 'bg-[#ECE9E1] text-[#424652] border-[#121316]/12',
    dotClass: 'bg-[#6E7382]',
  },
  medium: {
    label: 'Medium',
    stripClass: 'bg-[#5B8DEF]',
    badgeClass: 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/35',
    dotClass: 'bg-[#3762C4]',
  },
  high: {
    label: 'High',
    stripClass: 'bg-[#121316]',
    badgeClass: 'bg-[#121316] text-[#FAF9F6] border-[#121316]',
    dotClass: 'bg-[#5B8DEF]',
  },
};

const SUBJECT_PALETTES = [
  {
    chipClass: 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/35',
    dotClass: 'bg-[#3762C4]',
  },
  {
    chipClass: 'bg-[#F5F3EE] text-[#121316] border-[#121316]/15',
    dotClass: 'bg-[#424652]',
  },
  {
    chipClass: 'bg-[#121316] text-[#FAF9F6] border-[#121316]',
    dotClass: 'bg-[#5B8DEF]',
  },
  {
    chipClass: 'bg-[#ECE9E1] text-[#121316] border-[#121316]/12',
    dotClass: 'bg-[#121316]',
  },
  {
    chipClass: 'bg-emerald-500/12 text-emerald-800 border-emerald-500/25',
    dotClass: 'bg-emerald-500',
  },
  {
    chipClass: 'bg-sky-500/12 text-sky-800 border-sky-500/25',
    dotClass: 'bg-sky-500',
  },
];

export function getSubjectStyle(subject) {
  const clean = (subject || 'General').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTES[hash % SUBJECT_PALETTES.length];
}
