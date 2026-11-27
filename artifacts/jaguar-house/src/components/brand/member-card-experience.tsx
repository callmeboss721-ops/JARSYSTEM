"use client";

import Image from "next/image";
import { useState } from "react";
import { MemberCardFaces as DesignSystemMemberCardFaces, MemberStatusPanel as DesignSystemMemberStatusPanel, type MemberClub } from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { BrandArtworkButton, BrandButton } from "./brand-button";

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
      stampAssetBase="/ui/stamps/"
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
  const [openQrRequest, setOpenQrRequest] = useState(0);

  let action;
  if (ready && kind === "kratom") {
    action = (
      <BrandArtworkButton
        href="/redeem"
        src="/ui/artwork/redeem-action.webp"
        label="แลกรางวัล"
        testId="member-redeem-cta"
      />
    );
  } else if (ready) {
    action = (
      <BrandButton
        asset="btn-leaf-cannabis"
        label="แสดง QR"
        onClick={() => setOpenQrRequest((request) => request + 1)}
        testId="member-redeem-cta"
      />
    );
  } else {
    action = (
      <div role="status" className="flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-1">
        <Image
          src="/ui/artwork/collecting-status.webp"
          alt=""
          aria-hidden="true"
          width={300}
          height={110}
          sizes="(max-width: 420px) 140px, 180px"
          className="h-9 w-auto max-w-[48%] object-contain"
        />
        <span className="text-xs text-[var(--muted)]">อีก {remaining} แต้มเพื่อแลกรับฟรี</span>
      </div>
    );
  }

  return (
    <DesignSystemMemberStatusPanel
      kind={kind}
      memberCode={memberCode}
      memberPhone={memberPhone}
      balance={balance}
      qr={qr}
      action={action}
      openQrRequest={openQrRequest}
      brandV4AssetBase="/brand/v4"
      extraPoints={balance}
      buttonAssetBase="/ui/"
      memberCodeTestId={kind === "kratom" ? "text-member-code" : "cannabis-member-code"}
      qrTestId={kind === "kratom" ? "member-qr" : "cannabis-member-qr"}
    />
  );
}
