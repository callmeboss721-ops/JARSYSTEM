import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

export type BrandButtonArt = "btn-jaguar" | "btn-leaf" | "btn-leaf-cannabis" | "btn-frame" | "btn-crown";

const ART: Record<BrandButtonArt, string> = {
  "btn-jaguar": "btn-jaguar.webp",
  "btn-leaf": "btn-leaf.webp",
  "btn-leaf-cannabis": "btn-leaf-cannabis.webp",
  "btn-frame": "btn-frame.webp",
  "btn-crown": "btn-crown.webp",
};

type SharedProps = {
  asset: BrandButtonArt;
  label: string;
  className?: string;
  testId?: string;
};

type LinkProps = SharedProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  href: string;
  disabled?: never;
};

type ButtonProps = SharedProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  href?: never;
};

function Content({ asset, label }: Pick<SharedProps, "asset" | "label">) {
  return (
    <>
      <img
        src={`${import.meta.env.BASE_URL}brand/buttons/${ART[asset]}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <span className="brand-button__label">{label}</span>
    </>
  );
}

export function BrandButton(props: LinkProps | ButtonProps) {
  const { asset, label, className, testId, ...rest } = props;
  const classes = ["brand-button", `brand-button--${asset}`, className].filter(Boolean).join(" ");
  if ("href" in props && props.href) {
    return (
      <a {...rest as LinkProps} href={props.href} className={classes} aria-label={label} data-testid={testId} data-asset={asset}>
        <Content asset={asset} label={label} />
      </a>
    );
  }
  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} type={buttonProps.type ?? "button"} className={classes} aria-label={label} data-testid={testId} data-asset={asset}>
      <Content asset={asset} label={label} />
    </button>
  );
}
