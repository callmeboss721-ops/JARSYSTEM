export const BRAND_V4_ICON_NAMES = [
  "crown-vip",
  "kratom-bottle",
  "kratom-leaf",
  "cannabis-pass",
  "qr-scan",
  "stamp-coin",
  "reward-gift",
  "pos-counter",
  "bank-transfer",
  "delivery-24h",
  "map-pin-spk",
  "shield-pin",
  "member-card",
  "line-chat",
  "spark-bonus",
  "rank-shield",
] as const;

export type BrandV4IconName = (typeof BRAND_V4_ICON_NAMES)[number];
export type BrandV4IconVariant = "duotone" | "mono" | "png-128" | "png-512";

const DEFAULT_ASSET_BASE = "/jaguar-spk-design-system/brand/v4";

function iconPath(name: BrandV4IconName, variant: BrandV4IconVariant, assetBase: string) {
  const root = assetBase.replace(/\/+$/, "");
  if (variant === "png-128" || variant === "png-512") {
    const size = variant === "png-128" ? "128" : "512";
    return `${root}/png/${size}/${name}.png`;
  }
  return `${root}/svg/${variant}/${name}.svg`;
}

export function BrandV4Icon({
  name,
  variant = "duotone",
  size = 24,
  alt = "",
  className = "",
  assetBase = DEFAULT_ASSET_BASE,
}: {
  name: BrandV4IconName;
  variant?: BrandV4IconVariant;
  size?: number;
  alt?: string;
  className?: string;
  assetBase?: string;
}) {
  return (
    <img
      className={`brand-v4-icon ${className}`.trim()}
      src={iconPath(name, variant, assetBase)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
