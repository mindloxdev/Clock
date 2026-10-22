import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown under the title and wired up as the dialog's description. */
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  /**
   * The body fills the dialog and does not scroll itself, for content that
   * manages its own scrolling. Avoids a second scrollbar beside the first.
   */
  fillBody?: boolean;
}

/**
 * A modal built on the native `<dialog>` element.
 *
 * `showModal()` gives us the focus trap, Escape-to-close, an inert background
 * and top-layer stacking for free -- all of which a hand-rolled modal gets
 * subtly wrong. React stays the source of truth for `open`, so `cancel` is
 * intercepted and routed back through `onClose` instead of letting the element
 * close itself behind our back.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  fillBody = false,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = 'dlg-title-' + title.replace(/\W+/g, '-').toLowerCase();
  const descriptionId = description ? titleId + '-desc' : undefined;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  // The page behind a modal must not scroll under it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click reported against the dialog itself landed on the backdrop:
      // children are nested deeper, so they never match.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={clsx(
        'm-auto max-h-[min(88dvh,46rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-card',
        'border border-line bg-surface p-0 text-ink shadow-float',
        size === 'lg' ? 'sm:w-[44rem]' : 'sm:w-[32rem]',
      )}
    >
      {open ? (
        <div className="flex max-h-[min(88dvh,46rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-[17px] font-semibold tracking-[-0.01em]">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              <X size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <div
            className={clsx(
              'min-h-0 flex-1 px-6 py-5',
              fillBody ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
            )}
          >
            {children}
          </div>

          {footer ? (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
