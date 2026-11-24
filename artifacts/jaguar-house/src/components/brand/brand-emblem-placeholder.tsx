type Variant = "hero" | "card";

/** Original supplied JAGUAR logo, shown in full (object-contain, no crop). */
export function BrandEmblemPlaceholder({ variant }: { variant: Variant }) {
  const size = variant === "hero" ? "w-40 h-40 lg:w-48 lg:h-48" : "w-14 h-14 sm:w-16 sm:h-16 shrink-0";
  return (
    <img
      src="/brand/jaguar-logo.webp"
      alt="ตรา JAGUAR KRATOM พร้อมภาพจากัวร์"
      width={768}
      height={768}
      decoding="async"
      className={`${size} object-contain p-1 rounded-2xl border border-[var(--line)] bg-[var(--panel)]`}
      data-asset-slot="jaguar-emblem"
    />
  );
}
