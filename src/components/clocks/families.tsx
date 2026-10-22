import clsx from 'clsx';
import { useId, type CSSProperties } from 'react';

import type {
  DigitalSpec,
  FlipSpec,
  PanelSpec,
  RingSpec,
  TypeSpec,
  WidgetSpec,
} from '@/clocks/spec';
import { DayNightIcon } from '@/components/DayNight';
import type { ClockReading } from '@/hooks/useClockReading';
import { citySubtitle } from '@/time/defaults';
import type { SavedClock } from '@/time/types';
import {
  DATE_MEDIUM,
  DATE_SHORT,
  dayProgress,
  formatZonedDate,
  handAngles,
  timeParts,
} from '@/time/zones';

import { AnalogDial } from './AnalogDial';
import type { ClockFaceProps } from './face-types';

const FONT = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'Georgia, "Times New Roman", serif',
} as const;

/** How much of a round face's diameter is usable across the middle. */
const ROOM_FOR_CAPTION = 150;

const captionSize = (size: number) => Math.max(9, Math.round(size * 0.055));

function spokenTime(clock: SavedClock, reading: ClockReading): string {
  const { hh, mm, ss, meridiem } = timeParts(reading.time, reading.hour12);
  const body = reading.showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  return body + (meridiem ? ' ' + meridiem : '') + ' in ' + (clock.cityName || clock.timeZone);
}

/** The caption a preset asked for, or `null` when the clock hides it. */
function captionText(
  kind: 'date' | 'city' | 'offset' | 'zone' | 'none',
  clock: SavedClock,
  reading: ClockReading,
  short = true,
): string | null {
  switch (kind) {
    case 'date':
      return clock.prefs.showDate
        ? formatZonedDate(reading.time, short ? DATE_SHORT : DATE_MEDIUM)
        : null;
    case 'city':
      return clock.cityName;
    case 'offset':
      return clock.prefs.showOffset ? reading.offsetLabel : null;
    case 'zone':
      return clock.timeZone;
    default:
      return null;
  }
}

/** The digits, assembled with whichever separator the preset uses. */
function digitString(reading: ClockReading, separator: 'colon' | 'gap' | 'dot' = 'colon'): string {
  const { hh, mm, ss } = timeParts(reading.time, reading.hour12);
  const glue = separator === 'colon' ? ':' : separator === 'dot' ? '·' : ' ';
  return reading.showSeconds ? [hh, mm, ss].join(glue) : [hh, mm].join(glue);
}

// ------------------------------------------------------------------ analog --

export function AnalogFace({
  clock,
  reading,
  preset,
  palette,
  size,
  smoothSeconds,
}: ClockFaceProps) {
  const spec = preset.spec.family === 'analog' ? preset.spec : null;
  if (!spec) return null;

  // A custom colour from the clock's own settings wins over the preset's.
  const resolved = {
    ...palette,
    ...(clock.prefs.faceColor ? { bg: clock.prefs.faceColor } : null),
    ...(clock.prefs.handColor ? { ink: clock.prefs.handColor } : null),
  };
  const effective = clock.prefs.handColor ? { ...spec, metal: undefined } : spec;

  return (
    <AnalogDial
      size={size}
      spec={effective}
      palette={resolved}
      angles={handAngles(
        reading.time,
        smoothSeconds && clock.prefs.secondHand,
        spec.hours ?? 12,
      )}
      numerals={clock.prefs.numerals}
      minuteTicks={clock.prefs.minuteTicks}
      secondHand={clock.prefs.secondHand}
      label={spokenTime(clock, reading)}
    />
  );
}

// ----------------------------------------------------------------- digital --

export function DigitalFace({ clock, reading, preset, palette, size, hero }: ClockFaceProps) {
  const spec = preset.spec as DigitalSpec;
  const { meridiem } = timeParts(reading.time, reading.hour12);
  const caption = captionText(spec.caption, clock, reading);

  const digits = digitString(reading, spec.separator);
  const stacked = spec.layout === 'stacked';
  const { hh, mm } = timeParts(reading.time, reading.hour12);

  /*
    An inline hero takes its size from the `.hero-time` clamp. A stacked one
    cannot -- that clamp is tuned for an eight-glyph line, and two short rows
    want their own scale -- so it gets an explicit clamp instead of falling
    through to the inherited body size.
  */
  const fontSize = hero
    ? stacked
      ? 'clamp(3rem, 15vw, 10rem)'
      : undefined
    : Math.round(size * (stacked ? 0.26 : 0.4));

  const textStyle: CSSProperties = {
    fontFamily: FONT[spec.font],
    fontWeight: spec.weight,
    letterSpacing: spec.tracking + 'em',
    lineHeight: stacked ? 0.88 : 1,
    color: spec.outline ? 'transparent' : palette.ink,
    ...(fontSize ? { fontSize } : null),
    ...(spec.glow
      ? { textShadow: `0 0 5px ${spec.glow}99, 0 0 18px ${spec.glow}66, 0 0 44px ${spec.glow}33` }
      : null),
    ...(spec.hardShadow ? { textShadow: `4px 4px 0 ${spec.hardShadow}` } : null),
    ...(spec.outline ? { WebkitTextStroke: `1.5px ${palette.ink}` } : null),
  };

  return (
    <FaceShell palette={palette} radius={18}>
      <div className={clsx('flex flex-col', stacked ? 'items-start' : 'items-center', 'gap-2')}>
        <span
          className={clsx('tnum block', hero && !stacked && 'hero-time')}
          style={textStyle}
          role="img"
          aria-label={spokenTime(clock, reading)}
        >
          {stacked ? (
            <>
              <span className="block">{hh}</span>
              <span className="block">{mm}</span>
            </>
          ) : (
            digits
          )}
          {meridiem ? (
            <span
              className="ml-[0.18em] align-baseline text-[0.26em] font-medium tracking-normal"
              style={{ color: palette.caption, WebkitTextStroke: '0' }}
            >
              {meridiem}
            </span>
          ) : null}
        </span>

        {caption ? (
          <span
            className="text-[11px] tracking-[0.16em] uppercase"
            style={{ color: palette.caption, letterSpacing: (spec.captionTracking ?? 0.16) + 'em' }}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </FaceShell>
  );
}

// -------------------------------------------------------------------- ring --

export function RingFace({ clock, reading, preset, palette, size }: ClockFaceProps) {
  const spec = preset.spec as RingSpec;
  const uid = useId().replace(/:/g, '');
  const gradientId = uid + '-grad';

  const progress = dayProgress(reading.time);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const hourFraction = (reading.time.hour % 12) / 12 + reading.time.minute / 720;
  const minuteFraction = reading.time.minute / 60 + reading.time.second / 3600;

  const stroke = spec.gradient ? 'url(#' + gradientId + ')' : palette.accent;
  const caption =
    size >= ROOM_FOR_CAPTION
      ? spec.inner === 'time+percent'
        ? Math.round(progress * 100) + '% of day'
        : spec.inner === 'time+caption'
          ? (captionText('date', clock, reading) ?? clock.cityName)
          : null
      : spec.inner === 'time+percent'
        ? Math.round(progress * 100) + '%'
        : null;

  return (
    <div
      className="relative"
      style={{
        width: size,
        maxWidth: '100%',
        aspectRatio: '1 / 1',
        ...(palette.bg ? { backgroundColor: palette.bg, borderRadius: '50%' } : null),
      }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="block h-full w-full">
        {spec.gradient ? (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              {spec.gradient.map((stop, index) => (
                <stop
                  key={index}
                  offset={(index / Math.max(1, spec.gradient!.length - 1)) * 100 + '%'}
                  stopColor={stop}
                />
              ))}
            </linearGradient>
          </defs>
        ) : null}

        {spec.track || spec.mode === 'outline' ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={spec.mode === 'outline' ? (palette.line ?? palette.dim) : palette.dim}
            strokeWidth={spec.thickness}
            opacity={spec.mode === 'outline' ? 1 : 0.45}
          />
        ) : null}

        {spec.mode === 'progress' ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={spec.thickness}
            strokeLinecap={spec.cap}
            strokeDasharray={spec.dashed ? '2 3' : circumference}
            strokeDashoffset={spec.dashed ? 0 : circumference * (1 - progress)}
            transform="rotate(-90 50 50)"
            {...(spec.dashed
              ? { pathLength: 100, strokeDasharray: `${progress * 100} 100` }
              : null)}
          />
        ) : null}

        {spec.mode === 'full' ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={spec.thickness}
            transform="rotate(-45 50 50)"
          />
        ) : null}

        {/* Two arcs: the outer one is the hour, the inner one the minute. */}
        {spec.mode === 'dual' ? (
          <>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={stroke}
              strokeWidth={spec.thickness}
              strokeLinecap={spec.cap}
              pathLength={100}
              strokeDasharray={`${hourFraction * 100} 100`}
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r={radius - spec.thickness - 3}
              fill="none"
              stroke={palette.ink}
              strokeWidth={spec.thickness * 0.5}
              strokeLinecap={spec.cap}
              pathLength={100}
              strokeDasharray={`${minuteFraction * 100} 100`}
              transform="rotate(-90 50 50)"
              opacity="0.65"
            />
          </>
        ) : null}

        {/* Twenty-four blocks, lit up to the current hour. */}
        {spec.mode === 'segments'
          ? Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1="50"
                y1={50 - radius - spec.thickness / 2}
                x2="50"
                y2={50 - radius + spec.thickness / 2}
                stroke={i <= reading.time.hour ? stroke : palette.dim}
                strokeWidth="2.6"
                transform={`rotate(${i * 15} 50 50)`}
              />
            ))
          : null}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-[13%]">
        <span
          className="tnum font-semibold"
          style={{
            color: palette.ink,
            fontSize: Math.round(size * 0.155),
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
          role="img"
          aria-label={spokenTime(clock, reading)}
        >
          {digitString(reading)}
        </span>
        {caption ? (
          <span
            className="tnum tracking-[0.1em] uppercase"
            style={{ color: palette.caption, fontSize: captionSize(size) }}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- panel --

export function PanelFace({ clock, reading, preset, palette, size, hero }: ClockFaceProps) {
  const spec = preset.spec as PanelSpec;
  const caption = captionText(spec.caption, clock, reading);
  const digits = digitString(reading);
  const { meridiem } = timeParts(reading.time, reading.hour12);
  const fontSize = hero ? Math.round(size * 0.3) : Math.round(size * 0.2);

  const glass = spec.variant === 'glass';
  const brutal = spec.variant === 'brutal';
  const neumorph = spec.variant === 'neumorph';
  const clay = spec.variant === 'clay';
  const pixel = spec.variant === 'pixel';

  const panelStyle: CSSProperties = {
    borderRadius: spec.radius,
    maxWidth: '100%',
    ...(glass
      ? {
          background: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
          backdropFilter: 'blur(18px)',
        }
      : { background: palette.bg ?? 'transparent' }),
    ...(spec.variant === 'card' || spec.variant === 'eink' || spec.variant === 'lcd'
      ? { border: '1px solid ' + (palette.line ?? 'transparent') }
      : null),
    ...(spec.variant === 'lcd' ? { boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.22)' } : null),
    ...(brutal
      ? { border: '3px solid ' + (palette.line ?? '#000'), boxShadow: `6px 6px 0 ${spec.shadow ?? '#000'}` }
      : null),
    ...(neumorph
      ? {
          boxShadow: `-6px -6px 16px rgba(255,255,255,0.9), 6px 6px 16px rgba(0,0,0,0.13)`,
        }
      : null),
    ...(clay
      ? {
          boxShadow: `inset 0 -5px 10px rgba(0,0,0,0.08), 0 10px 22px rgba(0,0,0,0.12)`,
          border: '2px solid ' + (palette.line ?? 'transparent'),
        }
      : null),
    ...(spec.variant === 'hud' ? { border: '1px solid ' + (palette.line ?? 'transparent') } : null),
    ...(spec.variant === 'terminal'
      ? { border: '1px solid ' + (palette.line ?? 'transparent') }
      : null),
    ...(spec.variant === 'neon'
      ? {
          border: '1px solid ' + (palette.line ?? 'transparent'),
          boxShadow: spec.glow ? `0 0 28px -8px ${spec.glow}` : undefined,
        }
      : null),
  };

  const digitStyle: CSSProperties = {
    fontFamily: FONT[spec.font],
    fontWeight: spec.weight ?? 600,
    fontSize,
    lineHeight: 1,
    letterSpacing: spec.font === 'mono' ? '0.02em' : '-0.03em',
    color: palette.ink,
    ...(pixel ? { imageRendering: 'pixelated' } : null),
    ...(spec.glow
      ? { textShadow: `0 0 4px ${spec.glow}cc, 0 0 16px ${spec.glow}88, 0 0 40px ${spec.glow}44` }
      : null),
  };

  // Every segment lit, ghosted behind the live ones: an unlit LCD.
  const ghost = spec.ghost ? digits.replace(/\d/g, '8') : null;

  return (
    <div
      className="relative isolate overflow-hidden"
      style={{ width: Math.round(size * 1.4), maxWidth: '100%', borderRadius: spec.radius }}
    >
      {glass && spec.wash ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(120% 120% at 15% 10%, ${spec.wash[0]} 0%, ${spec.wash[1]} 55%, ${spec.wash[2]} 100%)`,
          }}
        />
      ) : null}

      <div className="flex flex-col items-center gap-2 px-6 py-6" style={panelStyle}>
        <span className="relative block" style={digitStyle} role="img" aria-label={spokenTime(clock, reading)}>
          {ghost ? (
            <span aria-hidden="true" className="tnum absolute inset-0 opacity-[0.13]">
              {ghost}
            </span>
          ) : null}
          <span className="tnum relative">{digits}</span>
          {meridiem ? (
            <span className="ml-[0.2em] text-[0.34em] font-medium" style={{ color: palette.caption }}>
              {meridiem}
            </span>
          ) : null}
        </span>

        {caption ? (
          <span
            className="max-w-full truncate text-[11px] tracking-[0.18em] uppercase"
            style={{
              color: palette.caption,
              fontFamily: spec.font === 'mono' ? FONT.mono : undefined,
            }}
          >
            {caption}
          </span>
        ) : null}
      </div>

      {spec.scanlines ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)',
            borderRadius: spec.radius,
          }}
        />
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------------- flip --

export function FlipFace({ clock, reading, preset, palette, size, hero }: ClockFaceProps) {
  const spec = preset.spec as FlipSpec;
  const { hh, mm, ss, meridiem } = timeParts(reading.time, reading.hour12);
  const groups = reading.showSeconds ? [hh, mm, ss] : [hh, mm];
  const tileFont = hero ? Math.round(size * 0.26) : Math.round(size * 0.21);

  const tileStyle: CSSProperties = {
    fontSize: tileFont,
    background: `linear-gradient(180deg, ${spec.tile[0]} 0%, ${spec.tile[1]} 100%)`,
    color: spec.tileInk,
    border: spec.border ? '1px solid ' + spec.border : 'none',
    borderRadius: spec.radius,
  };

  return (
    <div
      className="flex items-end gap-2"
      style={{ perspective: '600px' }}
      role="img"
      aria-label={spokenTime(clock, reading)}
    >
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-end gap-1">
          {groupIndex > 0 && spec.separator === 'colon' ? (
            <span
              aria-hidden="true"
              className="mx-0.5 self-center"
              style={{ fontSize: tileFont * 0.5, color: palette.caption }}
            >
              :
            </span>
          ) : null}
          {[...group].map((digit, digitIndex) => (
            <span
              // The value is part of the key so a changed digit remounts and
              // replays the flip; the index keeps a pair's tiles distinct.
              key={groupIndex + '-' + digitIndex + '-' + digit}
              className="flip-tile tnum"
              style={tileStyle}
            >
              {digit}
              {spec.seam ? <span aria-hidden="true" className="flip-seam" /> : null}
            </span>
          ))}
        </div>
      ))}
      {meridiem ? (
        <span
          className="pb-1 text-[11px] font-medium tracking-[0.14em]"
          style={{ color: palette.caption }}
        >
          {meridiem}
        </span>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------------- type --

export function TypeFace({ clock, reading, preset, palette, size, hero }: ClockFaceProps) {
  const spec = preset.spec as TypeSpec;
  const { hh, mm, ss, meridiem } = timeParts(reading.time, reading.hour12);
  const caption = captionText(spec.caption, clock, reading, false);

  const fontSize = hero
    ? spec.layout === 'stacked'
      ? 'clamp(3rem, 16vw, 10rem)'
      : 'clamp(2.75rem, 15vw, 9rem)'
    : Math.round(size * (spec.layout === 'stacked' ? 0.3 : 0.3));

  const style: CSSProperties = {
    fontFamily: FONT[spec.font],
    fontWeight: spec.weight,
    letterSpacing: spec.tracking + 'em',
    fontSize,
    lineHeight: spec.layout === 'stacked' ? 0.85 : 0.95,
    color: palette.ink,
  };

  return (
    <FaceShell palette={palette} radius={10}>
      <div
        className={clsx(
          'flex flex-col gap-3',
          spec.layout === 'ranged' ? 'items-start' : 'items-center',
        )}
      >
        <div className="tnum" style={style} role="img" aria-label={spokenTime(clock, reading)}>
          {spec.layout === 'stacked' ? (
            <>
              <span className="block">{hh}</span>
              <span className="block" style={{ color: palette.caption }}>
                {mm}
              </span>
            </>
          ) : (
            <span className="flex items-baseline">
              <span>{hh}</span>
              <span className="mx-[0.06em]" style={{ color: palette.caption }}>
                :
              </span>
              <span>{mm}</span>
              {reading.showSeconds ? (
                <span
                  className="ml-[0.14em] self-start text-[0.3em] tracking-[0.12em]"
                  style={{ color: palette.caption, fontWeight: 400 }}
                >
                  {ss}
                </span>
              ) : null}
              {meridiem ? (
                <span
                  className="ml-[0.16em] text-[0.22em] tracking-[0.22em]"
                  style={{ color: palette.caption, fontWeight: 400 }}
                >
                  {meridiem}
                </span>
              ) : null}
            </span>
          )}
        </div>

        {spec.rule ? (
          <span
            aria-hidden="true"
            className="block h-px w-12"
            style={{ background: palette.line ?? palette.dim }}
          />
        ) : null}

        {caption ? (
          <p
            className={clsx('text-[11px]', spec.uppercase && 'uppercase')}
            style={{ color: palette.caption, letterSpacing: '0.2em' }}
          >
            {caption}
          </p>
        ) : null}
      </div>
    </FaceShell>
  );
}

// ------------------------------------------------------------------ widget --

export function WidgetFace({ clock, reading, preset, palette, size, hero }: ClockFaceProps) {
  const spec = preset.spec as WidgetSpec;
  const date = clock.prefs.showDate ? formatZonedDate(reading.time, DATE_MEDIUM) : null;
  const digits = digitString(reading);
  const { meridiem } = timeParts(reading.time, reading.hour12);

  const digitStyle: CSSProperties = {
    fontFamily: FONT[spec.font],
    fontWeight: spec.weight,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    color: palette.ink,
    fontSize: hero
      ? 'clamp(2.5rem, 11vw, 6.5rem)'
      : Math.round(size * (spec.align === 'split' ? 0.24 : 0.26)),
  };

  const body =
    spec.align === 'split' ? (
      <div className="flex w-full items-stretch gap-5 sm:gap-7">
        <div className="flex min-w-0 flex-1 items-center">
          <span className="tnum block" style={digitStyle}>
            {digits}
            {meridiem ? (
              <span className="ml-1.5 text-[0.3em] font-medium" style={{ color: palette.caption }}>
                {meridiem}
              </span>
            ) : null}
          </span>
        </div>
        <div aria-hidden="true" className="w-px shrink-0" style={{ background: palette.line ?? palette.dim }} />
        <div className="flex w-[42%] max-w-[14rem] shrink-0 flex-col justify-center gap-1">
          <p className="truncate text-[13px] font-semibold" style={{ color: palette.ink }}>
            {clock.title}
          </p>
          {citySubtitle(clock) ? (
            <p className="truncate text-[12px]" style={{ color: palette.caption }}>
              {citySubtitle(clock)}
            </p>
          ) : null}
          {date ? (
            <p className="text-[12px]" style={{ color: palette.caption }}>
              {date}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: palette.caption }}>
            {spec.showIcon ? <DayNightIcon isDay={reading.isDay} size={13} /> : null}
            {clock.prefs.showOffset ? <span className="tnum">{reading.offsetLabel}</span> : null}
          </div>
        </div>
      </div>
    ) : (
      <div
        className={clsx(
          'flex w-full flex-col gap-2',
          spec.align === 'center' ? 'items-center text-center' : 'items-start',
        )}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <p className="truncate text-[12px] font-semibold tracking-[0.02em]" style={{ color: palette.ink }}>
            {clock.title}
          </p>
          {spec.showIcon ? (
            <DayNightIcon isDay={reading.isDay} size={14} className="shrink-0" />
          ) : null}
        </div>

        <span className="tnum block" style={digitStyle}>
          {digits}
          {meridiem ? (
            <span className="ml-1.5 text-[0.32em] font-medium" style={{ color: palette.caption }}>
              {meridiem}
            </span>
          ) : null}
        </span>

        <div
          className="flex w-full items-center justify-between gap-3 text-[11px]"
          style={{ color: palette.caption }}
        >
          <span className="truncate">{date ?? clock.cityName}</span>
          {clock.prefs.showOffset ? <span className="tnum shrink-0">{reading.offsetLabel}</span> : null}
        </div>
      </div>
    );

  return (
    <div
      className="flex w-full"
      style={{
        background: palette.bg ?? 'transparent',
        borderRadius: palette.bg ? 16 : 0,
        padding: palette.bg ? (spec.density === 'tight' ? '14px 16px' : '20px 22px') : 0,
        borderLeft: spec.accentBar === 'left' ? '3px solid ' + palette.accent : undefined,
        borderTop: spec.accentBar === 'top' ? '3px solid ' + palette.accent : undefined,
      }}
    >
      {body}
    </div>
  );
}

/**
 * The padded block a face sits in when its palette commits to a background.
 * A palette with `bg: null` follows the dashboard and needs no shell at all.
 */
function FaceShell({
  palette,
  radius,
  children,
}: {
  palette: ClockFaceProps['palette'];
  radius: number;
  children: React.ReactNode;
}) {
  if (!palette.bg) return <>{children}</>;
  return (
    <div
      style={{
        background: palette.bg,
        borderRadius: radius,
        padding: '22px 26px',
        border: palette.line ? '1px solid ' + palette.line : undefined,
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}
