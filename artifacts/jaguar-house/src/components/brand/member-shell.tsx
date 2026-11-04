"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { BrandIcon } from "./brand-icon";
import { JaguarMark } from "./jaguar-mark";
import { SamutPrakanArt } from "./samut-prakan-art";
import { clearMemberCache, setSessionHint } from "./api-utils";
import { api, errorText, json } from "./loyalty-api";

const NAV = [
  { href: "/card", th: "บัตรกระท่อม", icon: "/brand/icon-card-kratom.svg" },
  { href: "/card/cannabis", th: "บัตรกัญชา", icon: "/brand/icon-card-cannabis.svg" },
  { href: "/redeem", th: "รางวัล", icon: "/brand/icon-reward.svg" },
] as const;

export function MemberShell({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const [logoutErr, setLogoutErr] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const isActive = (href: string) => href === "/card"
    ? path === "/card"
    : href === "/card/cannabis"
      ? path === "/card/cannabis" || path === "/cannabis-card"
      : path === href;

  const doLogout = async () => {
    setLogoutErr(null);
    try {
      setLoggingOut(true);
      await api("/api/loyalty/logout", json("POST"));
    } catch (ex) {
      setLogoutErr(`ออกจากระบบไม่สำเร็จ: ${errorText(ex)}`);
      return;
    } finally {
      setLoggingOut(false);
    }
    setSessionHint(false);
    clearMemberCache(qc);
    router.replace("/");
  };

  return (
    <div className="customer-art-root min-h-[100dvh] pb-28 md:pb-12">
      <SamutPrakanArt />
      <header className="member-header sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(5,5,10,.85)] backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="member-shell-brand flex items-center min-h-11 gap-3 no-underline text-[var(--text)]" data-testid="link-home">
            <JaguarMark size={30} />
            <span className="leading-tight">
              <span className="brand-wordmark block font-display font-semibold text-[13px] text-[var(--gold-2)]">JAGUAR HOUSE</span>
              <span className="block eyebrow !text-[9px] !tracking-[.2em]">Members Club</span>
            </span>
          </Link>
          <nav aria-label="เมนูสมาชิก" className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl font-display text-sm no-underline transition-colors ${isActive(n.href) ? "text-[var(--gold-2)] bg-[rgba(196,202,214,.07)] shadow-[inset_0_-2px_0_var(--gold)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                data-testid={`link-nav-${n.href.slice(1)}`}
              >
                <img src={n.icon} width={20} height={20} alt="" aria-hidden="true" className="member-nav-icon" />{n.th}
              </Link>
            ))}
          </nav>
          {signedIn && (
            <button onClick={doLogout} disabled={loggingOut} className="btn btn-ghost !min-h-11 !min-w-11 !px-3 text-sm" aria-label="ออกจากระบบ" data-testid="button-logout">
              <BrandIcon name="logout" tone="neutral" />
              <span className="hidden min-[360px]:inline">ออกจากระบบ</span>
            </button>
          )}
        </div>
        {logoutErr && (
          <p role="alert" className="mx-auto max-w-5xl px-5 pb-3 text-sm text-[var(--danger)]" data-testid="text-logout-error">{logoutErr}</p>
        )}
      </header>
      <main className="member-main mx-auto max-w-5xl px-5 pt-6 md:pt-10">{children}</main>
      <nav aria-label="เมนูสมาชิก (มือถือ)" className="member-header md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--line)] bg-[rgba(5,5,10,.94)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`member-bottom-nav__item flex flex-col items-center justify-center gap-1 py-2 no-underline text-xs font-display ${active ? "is-active" : ""}`}
                data-testid={`mobile-nav-${n.href.slice(1).replaceAll("/", "-")}`}
              >
                <img src={n.icon} width={22} height={22} alt="" aria-hidden="true" className="member-nav-icon" />
                {n.th}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
