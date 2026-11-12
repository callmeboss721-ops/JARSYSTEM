import { useEffect, useRef, type ReactNode } from "react";
import { BrandIcon } from "./brand-icon";
import { JaguarMark } from "./jaguar-mark";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`loading-spinner ${className}`} />;
}

export function LoadingState({ label = "กำลังโหลดข้อมูล", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={`loading-state${compact ? " loading-state--compact" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <LoadingSpinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry, retrying }: { message: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="panel feedback-error" data-testid="state-error">
      <div className="feedback-error__title">
        <span className="sr-only">ข้อผิดพลาด:</span>
        <BrandIcon name="error" tone="danger" />
        <span>โหลดข้อมูลไม่สำเร็จ</span>
      </div>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost feedback-error__retry" onClick={onRetry} disabled={retrying} data-testid="button-retry">
          {retrying ? <LoadingSpinner /> : <BrandIcon name="retry" tone="neutral" />}
          {retrying ? "กำลังลองอีกครั้ง" : "ลองอีกครั้ง"}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="feedback-empty">
      <JaguarMark size={40} className="feedback-empty__mark" />
      <p>{title}</p>
      {body && <p className="feedback-empty__body">{body}</p>}
      {action}
    </div>
  );
}

export function SignedOutState({
  loginHref = "/login",
  registerHref = "/register",
}: {
  loginHref?: string;
  registerHref?: string;
}) {
  return (
    <div className="panel feedback-signed-out" data-testid="state-signed-out">
      <JaguarMark size={56} />
      <h1>กรุณาเข้าสู่ระบบสมาชิก</h1>
      <p>ยังไม่มีเซสชันสมาชิกบนอุปกรณ์นี้ ใช้รหัสสมาชิกของคุณเพื่อเปิดบัตร</p>
      <div>
        <a href={loginHref} className="btn btn-neon" data-testid="link-login">เข้าสู่ระบบ</a>
        <a href={registerHref} className="btn btn-ghost" data-testid="link-register">สมัครสมาชิก</a>
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
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.querySelector<HTMLElement>("[data-autofocus], button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab" && element) {
        const focusables = Array.from(element.querySelectorAll<HTMLElement>("button:not(:disabled), input, a[href]"));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="dialog panel">
        <button onClick={onClose} className="dialog__close" aria-label="ปิด">
          <BrandIcon name="close" tone="neutral" />
        </button>
        {children}
      </div>
    </div>
  );
}
