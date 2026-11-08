import { Timer } from 'lucide-react';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { PageTransition } from '../components/PageTransition';

export function Focus() {
  return (
    <PageTransition>
      <ComingSoonCard
        icon={Timer}
        title="Deep Study Timer"
        description="Distraction-free Pomodoro sessions and study streaks are coming soon."
        accentClass="from-[#FFE9CE] via-[#FF92A4]/25 to-[#4E51BF]/25"
      />
    </PageTransition>
  );
}
