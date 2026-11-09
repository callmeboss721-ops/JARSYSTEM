import Image from "next/image";
import Link from "next/link";

export type BrandButtonArt = "btn-jaguar" | "btn-leaf" | "btn-leaf-cannabis" | "btn-frame" | "btn-crown";

const ART: Record<BrandButtonArt, string> = {
  "btn-jaguar": "/ui/btn-jaguar.webp",
  "btn-leaf": "/ui/btn-leaf.webp",
  "btn-leaf-cannabis": "/ui/btn-leaf-cannabis.webp",
  "btn-frame": "/ui/btn-frame.webp",
  "btn-crown": "/ui/btn-crown.webp",
};

type BrandButtonProps = {
  asset: BrandButtonArt;
  label: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  testId?: string;
};

function Content({ asset, label }: Pick<BrandButtonProps, "asset" | "label">) {
  return (
    <>
      <Image src={ART[asset]} alt="" fill sizes="(max-width: 480px) 100vw, 390px" aria-hidden="true" />
      <span className="brand-button__label">{label}</span>
    </>
  );
}

export function BrandButton({
  asset,
  label,
  href,
  type = "button",
  disabled = false,
  onClick,
  className,
  testId,
}: BrandButtonProps) {
  const classes = ["brand-button", `brand-button--${asset}`, className].filter(Boolean).join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} data-testid={testId} data-asset={asset}>
        <Content asset={asset} label={label} />
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      data-asset={asset}
    >
      <Content asset={asset} label={label} />
    </button>
  );
}
