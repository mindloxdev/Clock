import clsx from 'clsx';
import { useId, type ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Spoken label, when the visible one is an abbreviation like `12h`. */
  srLabel?: string;
}

export interface SegmentedProps<T extends string> {
  name?: string;
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A segmented control built on real radio inputs.
 *
 * The inputs are visually hidden rather than replaced, so arrow-key movement,
 * the roving tab stop and the announced "2 of 3" all come from the platform.
 * A div with `role="radiogroup"` would mean re-implementing each of those.
 */
export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const generated = useId();
  const groupName = name ?? generated;

  return (
    <fieldset
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full border border-line bg-sunken p-0.5',
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <label
            key={option.value}
            className={clsx(
              'relative flex cursor-pointer items-center justify-center rounded-full font-medium transition-colors duration-150',
              // 40px tall inside 2px padding clears the 44px touch target.
              size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-10 px-4 text-[13px]',
              active ? 'bg-invert text-on-invert' : 'text-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span aria-hidden={option.srLabel ? 'true' : undefined}>{option.label}</span>
            {option.srLabel ? <span className="sr-only">{option.srLabel}</span> : null}
          </label>
        );
      })}
    </fieldset>
  );
}

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Extra context, read out with the label. */
  hint?: string;
}

/** A labelled on/off control. The whole row is the hit target. */
export function Switch({ label, checked, onChange, hint }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[13px] font-medium text-ink">
          {label}
        </label>
        {hint ? <span className="mt-0.5 block text-[12px] text-muted">{hint}</span> : null}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
          checked ? 'bg-invert' : 'bg-line-strong',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-[left] duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

export interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  /** Pass the control's id so the label points at it. */
  htmlFor?: string;
}

/** A visible label above a control, with optional helper text beneath it. */
export function Field({ label, hint, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[12px] font-medium tracking-wide text-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  'w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-faint transition-colors duration-150 hover:border-line-strong';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-invert text-on-invert hover:opacity-90',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-sunken',
  ghost: 'text-muted hover:bg-sunken hover:text-ink',
  danger: 'border border-line-strong bg-surface text-ink hover:bg-sunken',
};

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-[background-color,opacity,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'h-10 px-4 text-[13px]' : 'h-11 px-5 text-[14px]',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

/**
 * A square icon-only control. `label` is required and becomes the accessible
 * name, because an icon on its own has none.
 */
export function IconButton({
  label,
  children,
  className,
  ...rest
}: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface TabDefinition<T extends string> {
  value: T;
  label: string;
  /** A count shown beside the label, e.g. how many designs a tab holds. */
  badge?: string;
}

export interface TabsProps<T extends string> {
  label: string;
  value: T;
  tabs: readonly TabDefinition<T>[];
  onChange: (value: T) => void;
  /** Id of the element holding the panel, for `aria-controls`. */
  panelId: string;
}

/**
 * A real tab list: one tab stop for the whole set, arrow keys to move between
 * them, and `aria-selected` on the chosen one.
 *
 * Not the `Segmented` radio group, which is for choosing a *value*. These
 * switch which panel is on screen, and a screen reader should hear the
 * difference.
 */
export function Tabs<T extends string>({ label, value, tabs, onChange, panelId }: TabsProps<T>) {
  const id = useId();
  const index = tabs.findIndex((tab) => tab.value === value);

  const move = (to: number) => {
    const next = tabs[(to + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.value);
    // Selection follows focus, so move focus with it.
    requestAnimationFrame(() => {
      document.getElementById(id + '-' + ((to + tabs.length) % tabs.length))?.focus();
    });
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(index + 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(index - 1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          move(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          move(tabs.length - 1);
        }
      }}
      className="flex items-center gap-0.5 rounded-full border border-line bg-sunken p-0.5"
    >
      {tabs.map((tab, tabIndex) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            id={id + '-' + tabIndex}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={clsx(
              'flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors duration-150',
              active ? 'bg-invert text-on-invert' : 'text-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.badge ? (
              <span className={clsx('tnum text-[11px]', active ? 'opacity-70' : 'text-faint')}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
