type Props = { size?: number; className?: string; animated?: boolean; title?: string };

/**
 * House seal: a single understated jaguar rosette (broken ring around a core)
 * framed by a fine champagne-gold ring. No animal illustration by design.
 * `animated` is accepted for API compatibility and intentionally does nothing.
 */
export function JaguarMark({ size = 40, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <circle cx="24" cy="24" r="22.5" stroke="#E5C04A" strokeOpacity=".75" strokeWidth="1" />
      <circle cx="24" cy="24" r="19.5" stroke="#C4CAD6" strokeOpacity=".22" strokeWidth=".75" />
      <g stroke="#E5C04A" strokeWidth="2.2" strokeLinecap="round">
        <path d="M17.2 17.6a9 9 0 0 1 9.6-3.4" />
        <path d="M31.4 18.8a9 9 0 0 1 1.2 8.4" />
        <path d="M29.6 31.2a9 9 0 0 1-9 2.2" />
        <path d="M16.4 29.4a9 9 0 0 1-1.6-6.6" />
      </g>
      <ellipse cx="24" cy="24" rx="3.2" ry="2.6" fill="#E5C04A" fillOpacity=".9" />
    </svg>
  );
}

/** Small rosette glyph for filled stamp slots. */
export function PawGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M7.4 7.6a6 6 0 0 1 6.4-2.2" />
        <path d="M16.9 8.4a6 6 0 0 1 .8 5.6" />
        <path d="M15.7 16.7a6 6 0 0 1-6 1.5" />
        <path d="M6.9 15.5a6 6 0 0 1-1.1-4.4" />
      </g>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
