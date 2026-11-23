"use client";

import { MemberCardFaces as DesignSystemMemberCardFaces, MemberStatusPanel as DesignSystemMemberStatusPanel, type MemberClub } from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { BrandButton } from "./brand-button";

type CardQr = {
  value?: string;
  loading: boolean;
  error?: string;
  retry?: () => void;
  retrying?: boolean;
};

export function MemberCardFaces({
  kind,
  memberCode,
  memberLabel,
  memberPhone,
  balance,
  popKey,
}: {
  kind: MemberClub;
  memberCode: string;
  memberLabel?: string;
  memberPhone?: string | null;
  balance: number;
  popKey: number;
}) {
  return (
    <DesignSystemMemberCardFaces
      kind={kind}
      memberCode={memberCode}
      memberLabel={memberLabel}
      memberPhone={memberPhone}
      balance={balance}
      popKey={popKey}
      assetBase="/brand/"
      dataTestId={kind === "kratom" ? "card-member" : "card-cannabis-member"}
    />
  );
}

export function MemberStatusPanel({
  kind,
  memberCode,
  memberPhone,
  balance,
  qr,
}: {
  kind: MemberClub;
  memberCode: string;
  memberPhone?: string | null;
  balance: number;
  qr: CardQr;
}) {
  const ready = balance >= 10;
  const remaining = Math.max(10 - Math.min(Math.max(balance, 0), 10), 0);

  let action;
  if (ready && kind === "kratom") {
    action = <BrandButton href="/redeem" asset="btn-crown" label="แลกของแถม" testId="member-redeem-cta" />;
  } else if (ready) {
    action = (
      <BrandButton
        asset="btn-leaf-cannabis"
        label="แสดง QR"
        onClick={() => {
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          requestAnimationFrame(() => {
            document.getElementById("member-qr-target")?.scrollIntoView({
              behavior: reducedMotion ? "auto" : "smooth",
              block: "center",
            });
          });
        }}
        testId="member-redeem-cta"
      />
    );
  } else {
    action = <BrandButton asset="btn-frame" label={`อีก ${remaining} แต้ม`} disabled testId="member-redeem-cta" />;
  }

  return (
    <DesignSystemMemberStatusPanel
      kind={kind}
      memberCode={memberCode}
      memberPhone={memberPhone}
      balance={balance}
      qr={qr}
      action={action}
      extraPoints={balance}
      buttonAssetBase="/ui/"
      memberCodeTestId={kind === "kratom" ? "text-member-code" : "cannabis-member-code"}
      qrTestId={kind === "kratom" ? "member-qr" : "cannabis-member-qr"}
    />
  );
}
