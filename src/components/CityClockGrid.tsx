import { Plus } from 'lucide-react';

import { useDashboard } from '@/hooks/useDashboard';
import type { SavedClock } from '@/time/types';

import { CityClockCard } from './CityClockCard';
import { Button } from './ui/controls';

export interface CityClockGridProps {
  onAddCity: () => void;
  onEditClock: (clock: SavedClock) => void;
}

/**
 * The card row (§5).
 *
 * Two columns on phones and as many as fit comfortably above that, via an
 * `auto-fill` track rather than fixed breakpoints -- so the row re-flows at
 * whatever width the window happens to be instead of at three chosen sizes.
 */
export function CityClockGrid({ onAddCity, onEditClock }: CityClockGridProps) {
  const { state, hero, selectHero } = useDashboard();

  if (state.clocks.length === 0) {
    return (
      <section className="flex flex-col items-center gap-5 rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
        <div>
          <h3 className="text-[17px] font-semibold">No clocks yet</h3>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-muted">
            Add a city to start. Every clock keeps its own title, style and time zone.
          </p>
        </div>
        <Button variant="primary" onClick={onAddCity}>
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          Add a city
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="clock-row-heading" className="pb-16 sm:pb-24">
      <h3 id="clock-row-heading" className="sr-only">
        Your clocks
      </h3>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(13.5rem,1fr))]">
        {state.clocks.map((clock) => (
          <li key={clock.id}>
            <CityClockCard
              clock={clock}
              selected={clock.id === hero?.id}
              onSelect={() => selectHero(clock.id)}
              onEdit={() => onEditClock(clock)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
