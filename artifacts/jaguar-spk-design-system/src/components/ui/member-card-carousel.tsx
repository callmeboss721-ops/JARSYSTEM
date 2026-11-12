import { useRef, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";

export type CardKind = "kratom" | "cannabis";

/**
 * Shared dual-club switcher. Native anchors replace the app's Next links;
 * onNavigate lets a style-guide story keep navigation inside its preview.
 */
export function MemberCardCarousel({
  active,
  children,
  onNavigate,
}: {
  active: CardKind;
  children: ReactNode;
  onNavigate?: (path: string) => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const targetPath = active === "kratom" ? "/card/cannabis" : "/card";

  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.assign(path);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches.length === 1 ? event.changedTouches[0] : undefined;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if ((active === "kratom" && dx < 0) || (active === "cannabis" && dx > 0)) navigate(targetPath);
  };

  const onSwitchKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((active === "kratom" && event.key === "ArrowRight") || (active === "cannabis" && event.key === "ArrowLeft")) {
      event.preventDefault();
      navigate(targetPath);
    }
  };

  const switchLink = (kind: CardKind, path: string, number: string, label: string) => (
    <a
      href={path}
      aria-current={active === kind ? "page" : undefined}
      aria-label={`เปิดบัตรสะสมแต้ม${label}`}
      className="member-card-switcher__option"
      data-card={kind}
      data-active={active === kind}
      data-testid={`link-switch-${kind}`}
      onClick={onNavigate ? (event) => { event.preventDefault(); onNavigate(path); } : undefined}
    >
      <span className="member-card-switcher__number" aria-hidden="true">{number}</span>
      <span>{label}</span>
    </a>
  );

  return (
    <section className="member-card-stage" data-active={active} aria-label="บัตรสมาชิกสองประเภท">
      <nav className="member-card-switcher" aria-label="สลับบัตรสมาชิก" onKeyDown={onSwitchKeyDown}>
        {switchLink("kratom", "/card", "01", "กระท่อม")}
        {switchLink("cannabis", "/card/cannabis", "02", "กัญชา")}
      </nav>
      <p className="member-card-swipe-hint">ปัดซ้ายหรือขวาบนบัตรเพื่อสลับใบ</p>
      <div
        className="member-card-swipe-surface"
        data-active={active}
        data-testid="swipe-card-surface"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        {children}
      </div>
    </section>
  );
}
