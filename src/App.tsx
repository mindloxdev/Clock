import { useEffect, useState } from 'react';

import { AddClockModal } from '@/components/AddClockModal';
import { CityClockGrid } from '@/components/CityClockGrid';
import { CityHeading } from '@/components/CityHeading';
import { ClockSettings } from '@/components/ClockSettings';
import { FeaturedClocks } from '@/components/FeaturedClocks';
import { Nav } from '@/components/Nav';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TimeConverter } from '@/components/TimeConverter';
import { DashboardProvider, useDashboard } from '@/hooks/useDashboard';
import { WeatherProvider } from '@/hooks/useWeather';
import type { City } from '@/time/cities';
import type { SavedClock } from '@/time/types';

const CITY_HEADING_ID = 'selected-city';

function Dashboard() {
  const { state, hero, byId } = useDashboard();

  const [addOpen, setAddOpen] = useState(false);
  const [pendingCity, setPendingCity] = useState<City | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /*
    The theme lives on the root element, where the custom properties are
    scoped. An inline script in index.html sets the same two attributes before
    first paint, so a Midnight user never sees a flash of the light theme.
  */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.theme;
    root.dataset.accent = state.accent;
  }, [state.theme, state.accent]);

  // Resolved each render, so a rename shows up in the open dialog immediately.
  const editing = editingId ? (byId(editingId) ?? null) : null;

  // One dialog at a time: opening another closes the one that sent you.
  const openAdd = (city: City | null) => {
    setPendingCity(city);
    setSettingsOpen(false);
    setConverterOpen(false);
    setAddOpen(true);
  };

  const openClockSettings = (clock: SavedClock) => {
    setSettingsOpen(false);
    setEditingId(clock.id);
  };

  return (
    <>
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium"
      >
        Skip to dashboard
      </a>

      <Nav
        onPickCity={(city) => openAdd(city)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenConverter={() => setConverterOpen(true)}
      />

      <main id="dashboard" className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
        <h1 className="sr-only">MultiClock — world clock dashboard</h1>

        <FeaturedClocks onEditClock={openClockSettings} />

        {hero ? (
          <>
            <hr className="border-0 border-t border-line" />
            <CityHeading
              clock={hero}
              headingId={CITY_HEADING_ID}
              onAddCity={() => openAdd(null)}
            />
          </>
        ) : null}

        <CityClockGrid onAddCity={() => openAdd(null)} onEditClock={openClockSettings} />
      </main>

      <AddClockModal
        open={addOpen}
        initialCity={pendingCity}
        onClose={() => {
          setAddOpen(false);
          setPendingCity(null);
        }}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditClock={openClockSettings}
        onAddCity={() => openAdd(null)}
      />

      <TimeConverter open={converterOpen} onClose={() => setConverterOpen(false)} />

      <ClockSettings clock={editing} onClose={() => setEditingId(null)} />
    </>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <WeatherProvider>
        <Dashboard />
      </WeatherProvider>
    </DashboardProvider>
  );
}
