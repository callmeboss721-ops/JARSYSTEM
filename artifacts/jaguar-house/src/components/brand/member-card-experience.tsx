"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { BrandButton } from "./brand-button";

export type MemberClub = "kratom" | "cannabis";
export type MemberCardSide = "front" | "stamps";

type CardQr = {
  value?: string;
  loading: boolean;
  error?: string;
  retry?: () => void;
  retrying?: boolean;
};

const CLUBS: Record<MemberClub, { title: string; image: string; stampIcon: string; alt: string; rule: string; reward: string }> = {
  kratom: {
    title: "JAGUAR KRATOM",
    image: "/brand/card-kratom-full.jpg",
    stampIcon: "/brand/mark-jaguar.svg",
    alt: "บัตรสะสมแต้ม JAGUAR KRATOM ลายเสือจากัวร์",
    rule: "3 ขวด/บิล = 1 แต้ม",
    reward: "ฟรี 1 ขวด",
  },
  cannabis: {
    title: "JAGUAR CANNABIS",
    image: "/brand/card-cannabis-full.jpg",
    stampIcon: "/brand/mark-leaf.svg",
    alt: "บัตรสะสมแต้ม JAGUAR CANNABIS ลายใบกัญชา",
    rule: "ซื้อ 1 g = 1 แต้ม",
    reward: "ฟรี 1 g",
  },
};

export function MemberCardFaces({
  kind,
  memberCode,
  balance,
  popKey,
  side,
  onSideChange,
}: {
  kind: MemberClub;
  memberCode: string;
  balance: number;
  popKey: number;
  side: MemberCardSide;
  onSideChange: (side: MemberCardSide) => void;
}) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), 10);
  const ready = balance >= 10;

  return (
    <div className={`club-pass club-pass--${kind}`} data-testid={kind === "kratom" ? "card-member" : "card-cannabis-member"}>
      <div className="club-pass__switch" role="group" aria-label={`ด้านบัตร ${kind === "kratom" ? "กระท่อม" : "กัญชา"}`}>
        <button type="button" aria-pressed={side === "front"} onClick={() => onSideChange("front")}>
          หน้าบัตร
        </button>
        <button type="button" aria-pressed={side === "stamps"} onClick={() => onSideChange("stamps")}>
          แสตมป์
        </button>
      </div>

      {side === "front" ? (
        <figure id="member-card-face" className="club-pass__front">
          <Image
            src={club.image}
            alt={club.alt}
            fill
            priority
            sizes="(max-width: 480px) calc(100vw - 32px), 349px"
            className="club-pass__front-art"
          />
          <span className="club-pass__front-frame" aria-hidden="true" />
          <span className="sr-only">บัตรด้านหน้าสมาชิก @{memberCode}</span>
          <figcaption className="sr-only">{club.title} · บุญศิริ ซอย 6 · สมุทรปราการ</figcaption>
        </figure>
      ) : (
        <section id="member-card-face" className="club-pass__stamp-face" aria-label={`ด้านแสตมป์ ${club.title}`}>
          <header className="club-pass__stamp-head">
            <div>
              <span>JAGUAR SPK · COLLECTING</span>
              <strong>{filled}<small>/10</small></strong>
            </div>
            <Image src={club.stampIcon} alt="" width={23} height={23} aria-hidden="true" />
          </header>
          <ol className="club-pass__stamp-grid" aria-label={`${filled} จาก 10 แต้มสะสม`}>
            {Array.from({ length: 10 }, (_, index) => {
              const rewardSlot = index === 9;
              const isFilled = index < filled;
              return (
                <li
                  key={`${popKey}-${index}`}
                  className="club-pass__stamp"
                  data-filled={isFilled}
                  data-reward={rewardSlot}
                  data-ready={ready}
                  data-pop={popKey > 0 && isFilled}
                  data-testid={`${kind === "kratom" ? "stamp" : "cannabis-stamp"}-${index + 1}`}
                  aria-label={
                    rewardSlot
                      ? `ช่อง 10 ฟรี ${ready ? "พร้อมแลก" : ""}`
                      : `ช่อง ${index + 1} ${isFilled ? "สะสมแล้ว" : "ยังไม่สะสม"}`
                  }
                >
                  {rewardSlot ? (
                    <>
                      <strong>FREE!</strong>
                      <small>แถมฟรี</small>
                    </>
                  ) : isFilled ? (
                    <Image src={club.stampIcon} alt="" width={28} height={28} aria-hidden="true" />
                  ) : (
                    <span className="club-pass__stamp-number">{String(index + 1).padStart(2, "0")}</span>
                  )}
                  <span className="sr-only">
                    {rewardSlot ? `ครบ 10 แต้ม ${club.reward}` : isFilled ? "สะสมแล้ว" : "ยังไม่สะสม"}
                  </span>
                </li>
              );
            })}
          </ol>
          <footer className="club-pass__stamp-foot">
            <span>{club.rule}</span>
            <span>{club.reward}</span>
          </footer>
        </section>
      )}
      <span className="sr-only" aria-live="polite">
        {side === "front" ? "แสดงหน้าบัตร" : `แสดงแสตมป์ ${filled} จาก 10`}
      </span>
      <span className="sr-only">สมาชิก @{memberCode}</span>
    </div>
  );
}

export function MemberStatusPanel({
  kind,
  memberCode,
  balance,
  qr,
  onShowCard,
}: {
  kind: MemberClub;
  memberCode: string;
  balance: number;
  qr: CardQr;
  onShowCard?: () => void;
}) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), 10);
  const remaining = Math.max(10 - filled, 0);
  const ready = balance >= 10;

  return (
    <section className={`member-dashboard-status member-dashboard-status--${kind}`} aria-label="สถานะสมาชิก">
      <div className="member-dashboard-status__main">
        <header>
          <div>
            <span className="member-dashboard-status__eyebrow">MEMBERS CLUB</span>
            <h2>สวัสดี <strong data-testid={kind === "kratom" ? "text-member-code" : "cannabis-member-code"}>@{memberCode}</strong></h2>
          </div>
          <span className="member-dashboard-status__chip" data-ready={ready}>
            {ready ? "พร้อมแลก" : "กำลังสะสม"}
          </span>
        </header>
        <div className="member-dashboard-status__points">
          <span>แต้มสะสม</span>
          <strong>{filled}<small>/10</small></strong>
          <span className="member-dashboard-status__remaining">
            {ready ? club.reward : `อีก ${remaining} แต้ม`}
          </span>
        </div>
        <div
          className="member-dashboard-status__bar"
          role="progressbar"
          aria-label={`แต้มสะสม ${filled} จาก 10`}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={filled}
        >
          <span style={{ width: `${filled * 10}%` }} />
        </div>
        {balance > 10 && <span className="member-dashboard-status__extra" data-testid="text-extra-points">แต้มคงเหลือ {balance}</span>}
        {ready && kind === "cannabis" && <span className="member-dashboard-status__redeem-note">แสดง QR ให้พนักงานยืนยันรับฟรี 1 g</span>}
        {ready && kind === "kratom" ? (
          <BrandButton href="/redeem" asset="btn-crown" label="แลกของแถม" testId="member-redeem-cta" />
        ) : ready ? (
          <BrandButton asset="btn-leaf-cannabis" label="แสดง QR" onClick={() => {
            onShowCard?.();
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            requestAnimationFrame(() => {
              document.getElementById("member-card-face")?.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "center",
              });
            });
          }} testId="member-redeem-cta" />
        ) : (
          <BrandButton asset="btn-frame" label={`อีก ${remaining} แต้ม`} disabled testId="member-redeem-cta" />
        )}
      </div>
      <div
        className="member-dashboard-status__qr"
        aria-label="QR ส่วนตัวสำหรับพนักงานสแกน"
        data-testid={kind === "kratom" ? "member-qr" : "cannabis-member-qr"}
      >
        {qr.loading ? (
          <span className="member-dashboard-status__qr-loading" aria-label="กำลังโหลด QR" />
        ) : qr.error || !qr.value ? (
          <div className="member-dashboard-status__qr-error">
            <span role="alert">QR ไม่พร้อม</span>
            <button type="button" onClick={qr.retry} disabled={qr.retrying}>
              {qr.retrying ? "รอ…" : "ลองใหม่"}
            </button>
          </div>
        ) : (
          <QRCodeSVG value={qr.value} size={62} level="M" aria-label={`QR สมาชิก ${memberCode}`} />
        )}
        <small>สแกนที่ร้าน</small>
      </div>
    </section>
  );
}
