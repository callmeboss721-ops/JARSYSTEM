import Link from "next/link";
import { BrandIcon } from "./brand-icon";

type MemberQuickActionsProps = {
  kind: "kratom" | "cannabis";
};

export function MemberQuickActions({ kind }: MemberQuickActionsProps) {
  return (
    <nav className="member-quick-actions" data-kind={kind} aria-label="ทางลัดบัตรสมาชิก">
      <a href="#member-qr-target">
        <BrandIcon name="qr" size={19} aria-hidden="true" />
        <span>แสดง QR</span>
      </a>
      <a href="#member-activity">
        <BrandIcon name="points" size={19} aria-hidden="true" />
        <span>ประวัติแต้ม</span>
      </a>
      {kind === "kratom" ? (
        <Link href="/redeem">
          <BrandIcon name="rewards" size={19} aria-hidden="true" />
          <span>สิทธิ์ของฟรี</span>
        </Link>
      ) : (
        <a href="#member-reward">
          <BrandIcon name="rewards" size={19} aria-hidden="true" />
          <span>สิทธิ์ของฟรี</span>
        </a>
      )}
    </nav>
  );
}
