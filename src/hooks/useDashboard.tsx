import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { MAX_FEATURED, createClock, newId } from '@/time/defaults';
import { loadState, saveState } from '@/time/storage';
import type {
  AccentId,
  ClockPrefs,
  ClockStyleId,
  DashboardState,
  SavedClock,
  ThemeId,
  UnitSystem,
} from '@/time/types';

/** Everything the UI may change about a saved clock, bar its identity. */
export interface ClockPatch {
  title?: string;
  style?: ClockStyleId;
  prefs?: Partial<ClockPrefs>;
}

type Action =
  | { type: 'add'; clock: SavedClock }
  | { type: 'update'; id: string; patch: ClockPatch }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; delta: number }
  | { type: 'duplicate'; id: string }
  | { type: 'selectHero'; id: string }
  | { type: 'featuredCount'; count: number }
  | { type: 'featuredSlot'; index: number; id: string }
  | { type: 'toggleFeatured'; id: string }
  | { type: 'hour12'; value: boolean }
  | { type: 'theme'; value: ThemeId }
  | { type: 'accent'; value: AccentId }
  | { type: 'weather'; value: boolean }
  | { type: 'units'; value: UnitSystem };

/**
 * Grows or trims the featured list to `count`, drawing replacements from the
 * dashboard in display order so the layout selector always lands on a full
 * set without asking the user to pick three clocks first.
 */
function resizeFeatured(featured: string[], clocks: SavedClock[], count: number): string[] {
  const target = Math.max(1, Math.min(MAX_FEATURED, count));
  const next = featured.slice(0, target);
  for (const clock of clocks) {
    if (next.length >= target) break;
    if (!next.includes(clock.id)) next.push(clock.id);
  }
  return next;
}

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'add': {
      const clocks = [...state.clocks, action.clock];
      // A clock you just added should be the one you are looking at.
      const featured = state.featured.length
        ? [action.clock.id, ...state.featured.filter((id) => id !== action.clock.id)].slice(
            0,
            state.featured.length,
          )
        : [action.clock.id];
      return { ...state, clocks, featured };
    }

    case 'update': {
      const { patch } = action;
      return {
        ...state,
        clocks: state.clocks.map((clock) => {
          if (clock.id !== action.id) return clock;
          const title = patch.title?.trim();
          return {
            ...clock,
            // A blank title falls back to the city rather than leaving a card
            // with no label at all.
            title: patch.title === undefined ? clock.title : title || clock.cityName,
            style: patch.style ?? clock.style,
            prefs: patch.prefs ? { ...clock.prefs, ...patch.prefs } : clock.prefs,
          };
        }),
      };
    }

    case 'remove': {
      const clocks = state.clocks.filter((clock) => clock.id !== action.id);
      let featured = state.featured.filter((id) => id !== action.id);
      // Keep slot 0 occupied while any clock remains: the hero and the city
      // heading both read from it.
      if (featured.length === 0 && clocks.length > 0) {
        featured = resizeFeatured([], clocks, Math.max(1, state.featured.length - 1));
      }
      return { ...state, clocks, featured };
    }

    case 'move': {
      const index = state.clocks.findIndex((clock) => clock.id === action.id);
      if (index === -1) return state;
      const target = index + action.delta;
      if (target < 0 || target >= state.clocks.length) return state;
      const clocks = [...state.clocks];
      const [moved] = clocks.splice(index, 1);
      if (!moved) return state;
      clocks.splice(target, 0, moved);
      return { ...state, clocks };
    }

    case 'duplicate': {
      const index = state.clocks.findIndex((clock) => clock.id === action.id);
      const source = state.clocks[index];
      if (!source) return state;
      const copy: SavedClock = {
        ...source,
        id: newId(),
        title: source.title + ' (copy)',
        prefs: { ...source.prefs },
      };
      const clocks = [...state.clocks];
      clocks.splice(index + 1, 0, copy);
      return { ...state, clocks };
    }

    case 'selectHero': {
      if (!state.clocks.some((clock) => clock.id === action.id)) return state;
      const size = Math.max(1, state.featured.length);
      // Promotes the clock into slot 0 without changing how many are featured.
      const featured = [action.id, ...state.featured.filter((id) => id !== action.id)].slice(0, size);
      return { ...state, featured };
    }

    case 'featuredCount':
      return { ...state, featured: resizeFeatured(state.featured, state.clocks, action.count) };

    case 'toggleFeatured': {
      if (!state.clocks.some((clock) => clock.id === action.id)) return state;
      if (state.featured.includes(action.id)) {
        // Something has to stay featured: the hero and the city heading both
        // read slot 0, so un-featuring the last one is refused.
        if (state.featured.length === 1) return state;
        return { ...state, featured: state.featured.filter((id) => id !== action.id) };
      }
      if (state.featured.length < MAX_FEATURED) {
        return { ...state, featured: [...state.featured, action.id] };
      }
      // Already at three: the newcomer takes the last slot.
      return { ...state, featured: [...state.featured.slice(0, MAX_FEATURED - 1), action.id] };
    }

    case 'featuredSlot': {
      if (action.index < 0 || action.index >= state.featured.length) return state;
      if (!state.clocks.some((clock) => clock.id === action.id)) return state;
      const featured = [...state.featured];
      const existing = featured.indexOf(action.id);
      const outgoing = featured[action.index];
      // Already featured elsewhere: swap, so a clock never fills two slots.
      if (existing !== -1 && existing !== action.index && outgoing) featured[existing] = outgoing;
      featured[action.index] = action.id;
      return { ...state, featured };
    }

    case 'hour12':
      return { ...state, hour12: action.value };

    case 'theme':
      return { ...state, theme: action.value };

    case 'accent':
      return { ...state, accent: action.value };

    case 'weather':
      return { ...state, weather: action.value };

    case 'units':
      return { ...state, units: action.value };

    default:
      return state;
  }
}

export interface DashboardApi {
  state: DashboardState;
  /** `featured[0]`, resolved. `null` only when no clocks are saved. */
  hero: SavedClock | null;
  /** The featured clocks, resolved and in slot order. */
  featured: SavedClock[];
  byId: (id: string) => SavedClock | undefined;
  addClock: (input: Parameters<typeof createClock>[0]) => void;
  updateClock: (id: string, patch: ClockPatch) => void;
  removeClock: (id: string) => void;
  moveClock: (id: string, delta: number) => void;
  duplicateClock: (id: string) => void;
  selectHero: (id: string) => void;
  setFeaturedCount: (count: number) => void;
  setFeaturedSlot: (index: number, id: string) => void;
  toggleFeatured: (id: string) => void;
  setHour12: (value: boolean) => void;
  setTheme: (value: ThemeId) => void;
  setAccent: (value: AccentId) => void;
  setWeather: (value: boolean) => void;
  setUnits: (value: UnitSystem) => void;
}

const DashboardContext = createContext<DashboardApi | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const api = useMemo<DashboardApi>(() => {
    const index = new Map(state.clocks.map((clock) => [clock.id, clock]));
    const featured = state.featured
      .map((id) => index.get(id))
      .filter((clock): clock is SavedClock => clock !== undefined);

    return {
      state,
      hero: featured[0] ?? null,
      featured,
      byId: (id) => index.get(id),
      addClock: (input) => dispatch({ type: 'add', clock: createClock(input) }),
      updateClock: (id, patch) => dispatch({ type: 'update', id, patch }),
      removeClock: (id) => dispatch({ type: 'remove', id }),
      moveClock: (id, delta) => dispatch({ type: 'move', id, delta }),
      duplicateClock: (id) => dispatch({ type: 'duplicate', id }),
      selectHero: (id) => dispatch({ type: 'selectHero', id }),
      setFeaturedCount: (count) => dispatch({ type: 'featuredCount', count }),
      setFeaturedSlot: (slotIndex, id) => dispatch({ type: 'featuredSlot', index: slotIndex, id }),
      toggleFeatured: (id) => dispatch({ type: 'toggleFeatured', id }),
      setHour12: (value) => dispatch({ type: 'hour12', value }),
      setTheme: (value) => dispatch({ type: 'theme', value }),
      setAccent: (value) => dispatch({ type: 'accent', value }),
      setWeather: (value) => dispatch({ type: 'weather', value }),
      setUnits: (value) => dispatch({ type: 'units', value }),
    };
  }, [state]);

  return <DashboardContext.Provider value={api}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardApi {
  const api = useContext(DashboardContext);
  if (!api) throw new Error('useDashboard must be used inside a DashboardProvider');
  return api;
}
