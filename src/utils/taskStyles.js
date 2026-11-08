export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    stripClass: 'bg-[#4E51BF]',
    badgeClass: 'bg-[#4E51BF]/10 text-[#4E51BF] border-[#4E51BF]/20',
    dotClass: 'bg-[#4E51BF]',
  },
  medium: {
    label: 'Medium',
    stripClass: 'bg-[#F59E0B]',
    badgeClass: 'bg-[#FFE9CE] text-[#8A530D] border-[#F6D1A2]',
    dotClass: 'bg-[#F59E0B]',
  },
  high: {
    label: 'High',
    stripClass: 'bg-[#FF92A4]',
    badgeClass: 'bg-[#FF92A4]/20 text-[#9F1239] border-[#FF92A4]/45',
    dotClass: 'bg-[#FF92A4]',
  },
};

const SUBJECT_PALETTES = [
  {
    chipClass: 'bg-[#4E51BF]/10 text-[#3B3E9E] border-[#4E51BF]/20',
    dotClass: 'bg-[#4E51BF]',
  },
  {
    chipClass: 'bg-[#FFE9CE] text-[#5C3D18] border-[#F3D1A7]',
    dotClass: 'bg-[#D97706]',
  },
  {
    chipClass: 'bg-[#FF92A4]/20 text-[#881337] border-[#FF92A4]/40',
    dotClass: 'bg-[#FF92A4]',
  },
  {
    chipClass: 'bg-[#24252A]/[0.07] text-[#24252A] border-[#24252A]/15',
    dotClass: 'bg-[#24252A]',
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
