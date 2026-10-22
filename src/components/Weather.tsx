import clsx from 'clsx';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';

import { useClockWeather } from '@/hooks/useWeather';
import { useDashboard } from '@/hooks/useDashboard';
import type { SavedClock } from '@/time/types';
import {
  describeWeather,
  formatTemperature,
  formatWind,
  type WeatherIcon as IconId,
} from '@/time/weather';

type IconComponent = typeof Sun;

/**
 * Icons for the condition groups.
 *
 * Rain and showers share one, and so do freezing rain and hail: the icon says
 * what is falling and the label beside it says how much. Inventing a
 * distinct glyph per WMO code would make the row harder to read, not easier.
 */
const DAY_ICONS: Record<IconId, IconComponent> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  showers: CloudRain,
  snow: CloudSnow,
  freezing: CloudHail,
  hail: CloudHail,
  thunder: CloudLightning,
};

/** Only the two clear-sky icons have a night form; rain looks the same at 3am. */
const NIGHT_ICONS: Partial<Record<IconId, IconComponent>> = {
  clear: Moon,
  partly: CloudMoon,
};

export interface WeatherGlyphProps {
  icon: IconId;
  isDay: boolean;
  size?: number;
  className?: string;
}

export function WeatherGlyph({ icon, isDay, size = 14, className }: WeatherGlyphProps) {
  const Icon = (isDay ? DAY_ICONS[icon] : (NIGHT_ICONS[icon] ?? DAY_ICONS[icon])) ?? Cloud;
  return (
    <Icon size={size} strokeWidth={1.75} aria-hidden="true" className={clsx('shrink-0', className)} />
  );
}

export interface WeatherLineProps {
  clock: SavedClock;
  /** Whether it is daylight there, so the glyph matches the sky. */
  isDay: boolean;
  /**
   * `compact` is an icon and a temperature. `full` adds the condition in
   * words and what it feels like.
   */
  variant?: 'compact' | 'full';
  className?: string;
  iconSize?: number;
}

/**
 * Current conditions for one clock, or nothing at all.
 *
 * Renders `null` when the location has no coordinates, when the lookup has
 * not returned, or when it failed — the same rule sunrise follows. A clock
 * with no weather simply shows no weather.
 */
export function WeatherLine({
  clock,
  isDay,
  variant = 'compact',
  className,
  iconSize,
}: WeatherLineProps) {
  const { state } = useDashboard();
  const reading = useClockWeather(clock);
  if (!reading) return null;

  const condition = describeWeather(reading.code);
  const temperature = formatTemperature(reading.temperatureC, state.units);
  const feelsDifferent = Math.abs(reading.apparentC - reading.temperatureC) >= 2;

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <WeatherGlyph
        icon={condition?.icon ?? 'cloudy'}
        isDay={isDay}
        size={iconSize ?? (variant === 'full' ? 15 : 13)}
      />
      <span className="tnum">{temperature}</span>
      {variant === 'full' && condition ? (
        <>
          <span>{condition.label}</span>
          {feelsDifferent ? (
            <span className="text-faint">
              feels {formatTemperature(reading.apparentC, state.units)}
            </span>
          ) : null}
        </>
      ) : null}
      {/* The visible text reads "18° Partly cloudy"; name it properly instead. */}
      <span className="sr-only">
        {(condition?.label ?? 'Current conditions') +
          ', ' +
          temperature +
          (variant === 'full'
            ? ', wind ' + formatWind(reading.windKph, state.units) +
              ', humidity ' + reading.humidity + '%'
            : '')}
      </span>
    </span>
  );
}
