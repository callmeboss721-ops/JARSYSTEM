"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, X } from "lucide-react";
import { JaguarMark } from "./jaguar-mark";

export function ErrorState({ message, onRetry, retrying }: { message: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="panel p-6 flex flex-col items-start gap-4" data-testid="state-error">
      <div className="flex items-center gap-3 text-[var(--danger)]">
        <AlertTriangle size={20} aria-hidden="true" />
        <span className="font-display font-semibold">โหลดข้อมูลไม่สำเร็จ</span>
      </div>
      <p className="text-sm text-[var(--muted)]">{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry} disabled={retrying} data-testid="button-retry">
          <RotateCw size={16} aria-hidden="true" className={retrying ? "animate-spin" : undefined} />
          ลองอีกครั้ง
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line-2)] p-8 text-center flex flex-col items-center gap-3">
      <JaguarMark size={44} className="opacity-40" />
      <p className="font-display font-semibold">{title}</p>
      {body && <p className="text-sm text-[var(--muted)] max-w-xs">{body}</p>}
      {action}
    </div>
  );
}

export function SignedOutState() {
  return (
    <div className="panel p-8 flex flex-col items-center text-center gap-4 rise" data-testid="state-signed-out">
      <JaguarMark size={64} animated />
      <h1 className="font-display text-2xl font-semibold">กรุณาเข้าสู่ระบบสมาชิก</h1>
      <p className="text-[var(--muted)] text-sm max-w-xs">ยังไม่มีเซสชันสมาชิกบนอุปกรณ์นี้ ใช้รหัสสมาชิกของคุณเพื่อเปิดบัตร</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/login" className="btn btn-neon" data-testid="link-login">เข้าสู่ระบบ</Link>
        <Link href="/register" className="btn btn-ghost" data-testid="link-register">สมัครสมาชิก</Link>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>("[data-autofocus], button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>("button:not(:disabled), input, a[href]"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="dialog panel p-6 relative">
        <button onClick={onClose} className="absolute right-3 top-3 p-2 text-[var(--muted)] hover:text-[var(--text)] bg-transparent border-0 cursor-pointer" aria-label="ปิด">
          <X size={18} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
