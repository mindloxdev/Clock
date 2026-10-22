import { ArrowLeftRight, Moon, Palette, Settings2, Sun } from 'lucide-react';

import { useDashboard } from '@/hooks/useDashboard';
import type { City } from '@/time/cities';
import type { ThemeId } from '@/time/types';

import { CitySearch } from './CitySearch';
import { Logo } from './Logo';
import { IconButton } from './ui/controls';

/** Cycle order for the nav toggle, and the names it announces. */
const THEME_CYCLE: { id: ThemeId; name: string; Icon: typeof Sun }[] = [
  { id: 'classic-light', name: 'Classic Light', Icon: Sun },
  { id: 'midnight', name: 'Midnight', Icon: Moon },
  { id: 'soft-neutral', name: 'Soft Neutral', Icon: Palette },
];

export interface NavProps {
  onPickCity: (city: City) => void;
  onOpenSettings: () => void;
  onOpenConverter: () => void;
}

/**
 * The slim header: mark and name, the search, and two controls.
 *
 * There is no Log In, because no authentication is implemented and the spec
 * asks for one only if there is. There are no other pages either -- the
 * dashboard is the product.
 */
export function Nav({ onPickCity, onOpenSettings, onOpenConverter }: NavProps) {
  const { state, setTheme } = useDashboard();

  const index = THEME_CYCLE.findIndex((entry) => entry.id === state.theme);
  const current = THEME_CYCLE[index] ?? THEME_CYCLE[0]!;
  const next = THEME_CYCLE[(Math.max(0, index) + 1) % THEME_CYCLE.length]!;
  const { Icon } = current;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/88 backdrop-blur-md">
      {/*
        One row on a laptop, two on a phone. Wrapping rather than hiding the
        search behind another tap: squeezed between the mark and three
        buttons it came out 157px wide, which is not a search field.
        `order` keeps the search centred on wide screens and on its own line
        below them, from a single instance.
      */}
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:h-16 sm:flex-nowrap sm:gap-x-6 sm:px-8 sm:py-0">
        <div className="order-1 flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-[-0.015em]">MultiClock</span>
        </div>

        <div className="order-3 flex w-full min-w-0 justify-center sm:order-2 sm:w-auto sm:flex-1">
          <CitySearch onPickCity={onPickCity} />
        </div>

        <div className="order-2 ml-auto flex items-center gap-0.5 sm:order-3 sm:ml-0">
          {/* The name states the action, so a three-way cycle still tells a
              screen-reader user where the next press lands. */}
          <IconButton
            label={'Theme: ' + current.name + '. Switch to ' + next.name + '.'}
            onClick={() => setTheme(next.id)}
          >
            <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
          </IconButton>
          <IconButton label="Compare times across cities" onClick={onOpenConverter}>
            <ArrowLeftRight size={17} strokeWidth={1.9} aria-hidden="true" />
          </IconButton>
          <IconButton label="Settings" onClick={onOpenSettings}>
            <Settings2 size={17} strokeWidth={1.9} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
