type Props = { size?: number; className?: string; animated?: boolean; title?: string };

/** Geometric jaguar head — gold facets, neon eyes. */
export function JaguarMark({ size = 40, className, animated = false, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id="jg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d897" />
          <stop offset=".55" stopColor="#d9b45a" />
          <stop offset="1" stopColor="#8a6a26" />
        </linearGradient>
      </defs>
      {/* ears */}
      <path d="M22 18 L44 34 L28 50 Z" fill="url(#jg-gold)" />
      <path d="M98 18 L76 34 L92 50 Z" fill="url(#jg-gold)" />
      {/* head */}
      <path
        d="M60 26 L82 32 L98 52 L94 76 L78 96 L60 104 L42 96 L26 76 L22 52 L38 32 Z"
        fill="#0b0d0b"
        stroke="url(#jg-gold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* forehead facets */}
      <path d="M60 30 L72 48 L60 58 L48 48 Z" fill="url(#jg-gold)" opacity=".9" />
      {/* rosettes */}
      <g fill="none" stroke="#d9b45a" strokeWidth="2" opacity=".75">
        <circle cx="36" cy="58" r="4" />
        <circle cx="84" cy="58" r="4" />
        <circle cx="42" cy="44" r="2.5" />
        <circle cx="78" cy="44" r="2.5" />
      </g>
      {/* eyes */}
      <g className={animated ? "jaguar-eye" : undefined}>
        <path d="M40 64 L54 62 L50 70 Z" fill="#00ff9d" />
        <path d="M80 64 L66 62 L70 70 Z" fill="#00ff9d" />
      </g>
      {/* muzzle */}
      <path d="M52 78 L68 78 L60 88 Z" fill="url(#jg-gold)" />
      <path d="M60 88 L60 94 M60 94 L52 98 M60 94 L68 98" stroke="#d9b45a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Small paw glyph for stamp slots. */
export function PawGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <ellipse cx="12" cy="16" rx="5" ry="4.2" />
      <ellipse cx="5.5" cy="10.5" rx="2" ry="2.6" />
      <ellipse cx="9.5" cy="6.5" rx="2" ry="2.7" />
      <ellipse cx="14.5" cy="6.5" rx="2" ry="2.7" />
      <ellipse cx="18.5" cy="10.5" rx="2" ry="2.6" />
    </svg>
  );
}
