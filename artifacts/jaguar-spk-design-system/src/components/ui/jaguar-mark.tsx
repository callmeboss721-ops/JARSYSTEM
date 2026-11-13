type Props = { size?: number; className?: string; title?: string; src?: string };

/** Transparent supplied JAGUAR SPK emblem, kept uncropped across app headers. */
export function JaguarMark({
  size = 40,
  className,
  title,
  src = "/jaguar-spk-design-system/brand/logos/logo-primary.webp",
}: Props) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      decoding="async"
      className={`jaguar-mark ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
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
