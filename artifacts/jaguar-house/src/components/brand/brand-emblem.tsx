type Variant = "hero" | "card";

/** Use the supplied original Jaguar artwork on the welcome page and member card. */
export function BrandEmblem({ variant }: { variant: Variant }) {
  return (
    <div className={`brand-emblem brand-emblem--${variant}`}>
      <span className="brand-emblem__frame">
        <img
          className="brand-emblem__image"
          src="/brand/jaguar-logo.webp"
          alt="ตรา JAGUAR KRATOM พร้อมภาพจากัวร์"
          width={variant === "hero" ? 280 : 56}
          height={variant === "hero" ? 280 : 56}
        />
      </span>
    </div>
  );
}
