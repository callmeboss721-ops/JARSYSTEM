import { BrandButton as DesignSystemBrandButton, type BrandButtonArt } from "@workspace/jaguar-spk-design-system/components/ui/brand-button";

export type { BrandButtonArt };

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

export function BrandButton(props: BrandButtonProps) {
  if (props.href) {
    return <DesignSystemBrandButton
      asset={props.asset}
      assetBase="/ui/"
      label={props.label}
      href={props.href}
      className={props.className}
      testId={props.testId}
    />;
  }
  return <DesignSystemBrandButton
    asset={props.asset}
    assetBase="/ui/"
    label={props.label}
    type={props.type}
    disabled={props.disabled}
    onClick={props.onClick}
    className={props.className}
    testId={props.testId}
  />;
}
