type Variant = "hero" | "card";

/**
 * CSS-only layout placeholder. Replace the slot with an approved brand asset
 * (including a future GLB render) when one exists; this is not the final emblem.
 */
export function BrandEmblemPlaceholder({ variant }: { variant: Variant }) {
  return (
    <div
      className={`brand-emblem-placeholder brand-emblem-placeholder--${variant}`}
      data-asset-slot="jaguar-emblem"
      data-asset-format="glb-compatible"
      data-placeholder="true"
      role="img"
      aria-label="พื้นที่สำรองตรา JAGUAR — PLACEHOLDER ยังไม่มี asset 3D"
    >
      <span className="brand-emblem-placeholder__face" aria-hidden="true">
        <span className="brand-emblem-placeholder__monogram">J</span>
      </span>
      <span className="brand-emblem-placeholder__label" aria-hidden="true">
        <span>EMBLEM</span>
        <span>PLACEHOLDER</span>
      </span>
    </div>
  );
}
