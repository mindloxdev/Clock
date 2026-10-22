import { useId } from 'react';

import type { AnalogSpec, FacePalette } from '@/clocks/spec';
import type { HandAngles } from '@/time/zones';

export interface AnalogDialProps {
  /** Rendered diameter in px. The drawing itself is resolution-independent. */
  size: number;
  angles: HandAngles;
  spec: AnalogSpec;
  palette: FacePalette;
  /** The clock's own settings, which override the preset's defaults. */
  numerals: boolean;
  minuteTicks: boolean;
  secondHand: boolean;
  /** Spoken form of the time, e.g. "9:41 AM in London". */
  label: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i);
const MINUTE_TICKS = Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 !== 0);
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const FONT_STACK = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'Georgia, "Times New Roman", serif',
} as const;

/**
 * One hand, drawn in whichever shape the preset asks for.
 *
 * `from` is the tail behind the centre and `to` the tip, both as y values on
 * the 200-unit dial, so a hand is described the way a watchmaker would: how
 * far past the pin it reaches and how far out it runs.
 */
function Hand({
  shape,
  from,
  to,
  width,
  color,
  angle,
}: {
  shape: AnalogSpec['hands'];
  from: number;
  to: number;
  width: number;
  color: string;
  angle: number;
}) {
  const transform = 'rotate(' + angle + ' 100 100)';
  const half = width / 2;

  if (shape === 'leaf') {
    const mid = (from + to) / 2;
    return (
      <path
        d={`M 100 ${to} Q ${100 + half * 1.6} ${mid} 100 ${from} Q ${100 - half * 1.6} ${mid} 100 ${to} Z`}
        fill={color}
        transform={transform}
      />
    );
  }

  if (shape === 'skeleton') {
    return (
      <rect
        x={100 - half}
        y={to}
        width={width}
        height={from - to}
        rx={half}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1.2, width * 0.28)}
        transform={transform}
      />
    );
  }

  if (shape === 'arrow') {
    const shoulder = to + width * 1.7;
    const tail = half * 0.4;
    return (
      <path
        d={
          `M 100 ${to} L ${100 + half} ${shoulder} L ${100 + tail} ${shoulder} ` +
          `L ${100 + tail} ${from} L ${100 - tail} ${from} L ${100 - tail} ${shoulder} ` +
          `L ${100 - half} ${shoulder} Z`
        }
        fill={color}
        transform={transform}
      />
    );
  }

  const strokeWidth = shape === 'needle' ? width * 0.55 : width;
  return (
    <line
      x1="100"
      y1={from}
      x2="100"
      y2={to}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap={shape === 'block' ? 'butt' : 'round'}
      transform={transform}
    />
  );
}

/**
 * A circular analog clock on a 200-unit square.
 *
 * Every analog preset in the catalogue renders through this one component, so
 * the part that has to be right -- where the hands point -- is written once
 * and the presets only vary how it looks.
 *
 * Hand angles arrive already computed (see `handAngles`) and are applied as
 * plain rotations with no CSS transition: on a sweeping second hand this
 * re-renders every frame, and a transition would chase a target that has
 * already moved.
 */
export function AnalogDial({
  size,
  angles,
  spec,
  palette,
  numerals,
  minuteTicks,
  secondHand,
  label,
}: AnalogDialProps) {
  const uid = useId().replace(/:/g, '');
  const metalId = uid + '-metal';
  const textureId = uid + '-texture';
  const clipId = uid + '-clip';

  const metal = spec.metal ? 'url(#' + metalId + ')' : null;
  const markPaint = metal ?? palette.ink;
  const handPaint = metal ?? palette.ink;

  const rimWidth =
    spec.rim === 'thick' ? 6 : spec.rim === 'double' ? 2.5 : spec.rim === 'inset' ? 3.5 : 1.5;
  const faceRadius = spec.rim === 'none' ? 99 : 99 - rimWidth / 2;
  const numeralRadius = spec.numerals === 'roman' ? 70 : 68;
  const showNumerals = numerals && spec.numerals !== 'none';
  const dialHours = spec.hours ?? 12;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      // `height: auto` with `max-width` keeps the dial round while it scales
      // down inside a slot narrower than the chosen size.
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        {spec.metal ? (
          <linearGradient id={metalId} x1="0" y1="0" x2="0.35" y2="1">
            {spec.metal.map((stop, index) => (
              <stop
                key={index}
                offset={(index / Math.max(1, spec.metal!.length - 1)) * 100 + '%'}
                stopColor={stop}
              />
            ))}
          </linearGradient>
        ) : null}

        {spec.texture === 'radial' ? (
          <radialGradient id={textureId} cx="0.42" cy="0.34" r="0.78">
            <stop offset="0%" stopColor={palette.ink} stopOpacity="0.1" />
            <stop offset="100%" stopColor={palette.ink} stopOpacity="0" />
          </radialGradient>
        ) : null}

        <clipPath id={clipId}>
          <circle cx="100" cy="100" r={faceRadius} />
        </clipPath>
      </defs>

      {palette.bg ? (
        <circle
          cx="100"
          cy="100"
          r={faceRadius}
          fill={palette.bg}
          stroke={spec.rim === 'none' ? 'none' : (palette.line ?? palette.ink)}
          strokeWidth={spec.rim === 'none' ? 0 : rimWidth}
        />
      ) : null}

      {/* Texture sits under the markers and is clipped to the dial. */}
      <g clipPath={'url(#' + clipId + ')'}>
        {spec.texture === 'radial' ? (
          <circle cx="100" cy="100" r={faceRadius} fill={'url(#' + textureId + ')'} />
        ) : null}

        {spec.texture === 'sunburst'
          ? Array.from({ length: 90 }, (_, i) => (
              <line
                key={i}
                x1="100"
                y1="100"
                x2="100"
                y2="6"
                stroke={palette.ink}
                strokeWidth="0.5"
                opacity="0.08"
                transform={'rotate(' + i * 4 + ' 100 100)'}
              />
            ))
          : null}

        {spec.texture === 'rings'
          ? [30, 48, 66, 84].map((r) => (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={palette.dim}
                strokeWidth="0.6"
                opacity="0.5"
              />
            ))
          : null}

        {spec.texture === 'grid'
          ? Array.from({ length: 9 }, (_, i) => 20 + i * 20).flatMap((p) => [
              <line key={'h' + p} x1="0" y1={p} x2="200" y2={p} stroke={palette.dim} strokeWidth="0.4" opacity="0.45" />,
              <line key={'v' + p} x1={p} y1="0" x2={p} y2="200" stroke={palette.dim} strokeWidth="0.4" opacity="0.45" />,
            ])
          : null}
      </g>

      {spec.rim === 'double' ? (
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={palette.line ?? palette.dim}
          strokeWidth="0.75"
        />
      ) : null}

      {spec.innerRing ? (
        <circle cx="100" cy="100" r="78" fill="none" stroke={palette.dim} strokeWidth="0.75" />
      ) : null}

      {minuteTicks && spec.minuteTicks
        ? MINUTE_TICKS.map((tick) => (
            <line
              key={tick}
              x1="100"
              y1="13"
              x2="100"
              y2="18"
              stroke={palette.dim}
              strokeWidth="1"
              strokeLinecap="round"
              transform={'rotate(' + tick * 6 + ' 100 100)'}
            />
          ))
        : null}

      {spec.markers === 'none'
        ? null
        : HOURS.map((hour) => {
            const major = hour % 3 === 0;
            const rotate = 'rotate(' + hour * 30 + ' 100 100)';

            if (spec.markers === 'dot') {
              return (
                <circle
                  key={hour}
                  cx="100"
                  cy="18"
                  r={major ? 3.2 : 2}
                  fill={markPaint}
                  transform={rotate}
                />
              );
            }
            if (spec.markers === 'square') {
              const s = major ? 7 : 4.5;
              return (
                <rect
                  key={hour}
                  x={100 - s / 2}
                  y={15}
                  width={s}
                  height={s}
                  fill={markPaint}
                  transform={rotate}
                />
              );
            }
            if (spec.markers === 'wedge') {
              const w = major ? 7 : 4;
              return (
                <path
                  key={hour}
                  d={`M 100 ${major ? 30 : 26} L ${100 + w / 2} 13 L ${100 - w / 2} 13 Z`}
                  fill={markPaint}
                  transform={rotate}
                />
              );
            }
            if (spec.markers === 'hairline') {
              return (
                <line
                  key={hour}
                  x1="100"
                  y1="13"
                  x2="100"
                  y2={major ? 24 : 20}
                  stroke={markPaint}
                  strokeWidth={major ? 1.8 : 1.1}
                  strokeLinecap="round"
                  transform={rotate}
                />
              );
            }
            return (
              <line
                key={hour}
                x1="100"
                y1="13"
                x2="100"
                y2={major ? 27 : 23}
                stroke={markPaint}
                strokeWidth={major ? 4 : 2.25}
                strokeLinecap="round"
                transform={rotate}
              />
            );
          })}

      {showNumerals
        ? (spec.numerals === 'twentyfour' ? Array.from({ length: 24 }, (_, i) => i) : HOURS)
            .filter((value) =>
              spec.numerals === 'quarters'
                ? value % 3 === 0
                : spec.numerals === 'twentyfour'
                  ? value % 2 === 0
                  : true,
            )
            .map((value) => {
              // A 24-hour dial puts 0 at the top and steps 15 degrees an hour.
              const step = spec.numerals === 'twentyfour' ? 15 : 30;
              const radians = (value * step * Math.PI) / 180;
              const text =
                spec.numerals === 'roman'
                  ? ROMAN[value]
                  : spec.numerals === 'twentyfour'
                    ? String(value).padStart(2, '0')
                    : String(value === 0 ? 12 : value);
              return (
                <text
                  key={value}
                  x={100 + numeralRadius * Math.sin(radians)}
                  y={100 - numeralRadius * Math.cos(radians)}
                  fill={palette.ink}
                  fontSize={spec.numerals === 'twentyfour' ? 9.5 : 15}
                  fontWeight="500"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontFamily: FONT_STACK[spec.numeralFont ?? 'sans'] }}
                >
                  {text}
                </text>
              );
            })
        : null}

      <Hand shape={spec.hands} from={111} to={52} width={7} color={handPaint} angle={angles.hour} />
      <Hand
        shape={spec.hands}
        from={113}
        to={dialHours === 24 ? 30 : 28}
        width={4.75}
        color={handPaint}
        angle={angles.minute}
      />

      {secondHand ? (
        <g transform={'rotate(' + angles.second + ' 100 100)'}>
          <line
            x1="100"
            y1={spec.secondHand === 'counterweight' || spec.secondHand === 'railway' ? 124 : 118}
            x2="100"
            y2="22"
            stroke={palette.accent}
            strokeWidth={spec.secondHand === 'thick' ? 2.8 : 1.6}
            strokeLinecap="round"
          />
          {/* The railway hand's paddle, and the chronograph's counterweight. */}
          {spec.secondHand === 'railway' ? (
            <circle cx="100" cy="30" r="7.5" fill={palette.accent} />
          ) : null}
          {spec.secondHand === 'counterweight' ? (
            <circle cx="100" cy="117" r="5" fill={palette.accent} />
          ) : null}
        </g>
      ) : null}

      {spec.pin === 'none' ? null : (
        <>
          <circle cx="100" cy="100" r="4.75" fill={palette.ink} />
          {spec.pin === 'ring' ? (
            <circle cx="100" cy="100" r="1.9" fill={palette.bg ?? 'var(--c-surface)'} />
          ) : null}
        </>
      )}
    </svg>
  );
}
