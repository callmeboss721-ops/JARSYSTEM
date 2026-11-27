import {
  CollectingTrack as DesignSystemCollectingTrack,
  LoyaltyCard as DesignSystemLoyaltyCard,
  LoyaltyCardArtwork as DesignSystemLoyaltyCardArtwork,
  LoyaltyProgress as DesignSystemLoyaltyProgress,
  SharedMemberCard as DesignSystemSharedMemberCard,
  STAMPS,
  type MemberClub,
} from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { BrandArtworkButton, BrandButton } from "./brand-button";
import type { MemberCardData } from "./loyalty-api";

export { STAMPS };
export { MemberCardFaces, MemberStatusPanel } from "./member-card-experience";

type CardQr = { value?: string; loading: boolean; error?: string; retry?: () => void; retrying?: boolean };

export function LoyaltyCard({ card, qr }: { card: MemberCardData; qr: CardQr }) {
  return (
    <DesignSystemLoyaltyCard
      kind="kratom"
      memberCode={card.member_code}
      balance={card.balance}
      qr={qr}
      assetBase="/brand/"
      buttonAssetBase="/ui/"
      stampAssetBase="/ui/stamps/"
      rewardAssetBase="/ui/stamps"
    />
  );
}

export function SharedMemberCard({
  kind,
  memberCode,
  balance,
  qr,
  className,
}: {
  kind: MemberClub;
  memberCode: string;
  balance: number;
  qr: CardQr;
  className?: string;
}) {
  return <DesignSystemSharedMemberCard kind={kind} memberCode={memberCode} balance={balance} qr={qr} className={className} assetBase="/brand/" />;
}

export function LoyaltyProgress({ balance, kind = "kratom" }: { balance: number; kind?: MemberClub }) {
  const ready = balance >= STAMPS;
  const remaining = Math.max(STAMPS - Math.min(Math.max(balance, 0), STAMPS), 0);
  const action = ready
    ? <BrandArtworkButton href="/redeem" src="/ui/artwork/redeem-button.webp" label="แลกรางวัล" />
    : <BrandButton asset="btn-frame" label={`อีก ${remaining} แต้ม`} disabled />;
  return <DesignSystemLoyaltyProgress balance={balance} kind={kind} buttonAssetBase="/ui/" stampAssetBase="/ui/stamps/" rewardAssetBase="/ui/stamps" action={action} />;
}

export function CollectingTrack({ balance, kind = "kratom", titleId, celebrationKey = 0 }: { balance: number; kind?: MemberClub; titleId?: string; celebrationKey?: number }) {
  return <DesignSystemCollectingTrack balance={balance} kind={kind} titleId={titleId} variant="v3" assetBase="/brand/v4" stampAssetBase="/ui/stamps/" rewardAssetBase="/ui/stamps" celebrationKey={celebrationKey} />;
}

export function LoyaltyCardArtwork({ variant }: { variant: MemberClub }) {
  return <DesignSystemLoyaltyCardArtwork variant={variant} assetBase="/brand/" />;
}

export function LoyaltyCardSkeleton() {
  return (
    <div className="member-card" aria-busy="true" aria-label="กำลังโหลดบัตร">
      <div className="member-card-inner p-6 space-y-6">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-16 w-28" />
        <div className="skeleton h-2 w-full" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: STAMPS }, (_, index) => <div key={index} className="skeleton aspect-square !rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
