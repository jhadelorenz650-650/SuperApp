import { CalendarDays } from 'lucide-react';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { PageTransition } from '../components/PageTransition';

export function Timetable() {
  return (
    <PageTransition>
      <ComingSoonCard
        icon={CalendarDays}
        title="Weekly Class Schedule"
        description="Your classes, lecture halls, and weekly timetable view will live right here."
        accentClass="from-[#4E51BF]/20 via-[#FFE9CE] to-[#FF92A4]/25"
      />
    </PageTransition>
  );
}
