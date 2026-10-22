/**
 * The mark: a clock at ten past ten, the pose watch catalogues use because it
 * leaves the dial open and reads as a clock at any size.
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 text-ink"
    >
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 12V6.9M12 12l3.5 2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
