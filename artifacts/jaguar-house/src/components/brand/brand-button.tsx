import { BrandButton as DesignSystemBrandButton, type BrandButtonArt } from "@workspace/jaguar-spk-design-system/components/ui/brand-button";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import Image from "next/image";
import Link from "next/link";

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

type BrandArtworkButtonProps = {
  src: string;
  label: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  testId?: string;
};

export function BrandArtworkButton({
  src,
  label,
  href,
  type = "button",
  disabled,
  className,
  testId,
}: BrandArtworkButtonProps) {
  const artwork = (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={550}
      height={190}
      className="brand-artwork-button__image"
      sizes="(max-width: 560px) 260px, 320px"
    />
  );

  if (href) {
    return (
      <Button asChild variant="ghost" className={`brand-artwork-button ${className ?? ""}`} data-testid={testId}>
        <Link href={href} aria-label={label}>{artwork}</Link>
      </Button>
    );
  }

  return (
    <Button
      type={type}
      variant="ghost"
      aria-label={label}
      disabled={disabled}
      className={`brand-artwork-button ${className ?? ""}`}
      data-testid={testId}
    >
      {artwork}
    </Button>
  );
}

export function BrandDeliveryLink({ className }: { className?: string }) {
  return (
    <Button
      asChild
      variant="ghost"
      className={`delivery-call-link ${className ?? ""}`}
      aria-label="โทร 0996125914 เพื่อสอบถามและยืนยันพื้นที่กับเงื่อนไขจัดส่ง"
    >
      <a href="tel:0996125914">
        <Image
          src="/ui/artwork/delivery-button.webp"
          alt="สั่งด่วนส่งฟรี"
          loading="eager"
          width={1056}
          height={436}
          sizes="(max-width: 640px) 100vw, 320px"
        />
      </a>
    </Button>
  );
}
