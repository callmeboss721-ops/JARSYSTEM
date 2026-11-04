"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";

type CardKind = "kratom" | "cannabis";

export function MemberCardCarousel({ active, children }: { active: CardKind; children: ReactNode }) {
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const targetPath = active === "kratom" ? "/card/cannabis" : "/card";

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
    if ((active === "kratom" && dx < 0) || (active === "cannabis" && dx > 0)) {
      router.push(targetPath, { scroll: false });
    }
  };

  const onSwitchKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((active === "kratom" && event.key === "ArrowRight") || (active === "cannabis" && event.key === "ArrowLeft")) {
      event.preventDefault();
      router.push(targetPath, { scroll: false });
    }
  };

  return (
    <section className="member-card-stage" data-active={active} aria-label="บัตรสมาชิกสองประเภท">
      <nav className="member-card-switcher" aria-label="สลับบัตรสมาชิก" onKeyDown={onSwitchKeyDown}>
        <Link
          href="/card"
          aria-current={active === "kratom" ? "page" : undefined}
          aria-label="เปิดบัตรสะสมแต้มกระท่อม"
          className="member-card-switcher__option"
          data-card="kratom"
          data-active={active === "kratom"}
          data-testid="link-switch-kratom"
        >
          <span className="member-card-switcher__number" aria-hidden="true">01</span>
          <span>กระท่อม</span>
        </Link>
        <Link
          href="/card/cannabis"
          aria-current={active === "cannabis" ? "page" : undefined}
          aria-label="เปิดบัตรสะสมแต้มกัญชา"
          className="member-card-switcher__option"
          data-card="cannabis"
          data-active={active === "cannabis"}
          data-testid="link-switch-cannabis"
        >
          <span className="member-card-switcher__number" aria-hidden="true">02</span>
          <span>กัญชา</span>
        </Link>
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
