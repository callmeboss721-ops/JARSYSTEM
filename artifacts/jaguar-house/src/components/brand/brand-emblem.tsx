import { JaguarMark } from "./jaguar-mark";

type Variant = "hero" | "card";

/** Shared presentation for the original JAGUAR artwork on welcome and member card. */
export function BrandEmblem({ variant }: { variant: Variant }) {
  const isHero = variant === "hero";

  return (
    <div
      className={`brand-emblem brand-emblem--${variant}`}
      role="img"
      aria-label="โลโก้ Jaguar Kratom House"
    >
      <span className="brand-emblem__frame">
        <JaguarMark size={isHero ? 176 : 56} />
      </span>
    </div>
  );
}
