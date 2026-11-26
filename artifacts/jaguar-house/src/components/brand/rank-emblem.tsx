import Image from "next/image";
import { MotionBadge } from "@workspace/jaguar-spk-design-system/components/ui/motion-badge";
import { RankEmblem as DesignSystemRankEmblem, RankShield as DesignSystemRankShield, type RankEmblemName } from "@workspace/jaguar-spk-design-system/components/ui/rank-emblems";
import { gradeFor } from "./loyalty-api";

export type { RankEmblemName };

export function RankEmblem({
  name,
  size = 24,
  className = "",
}: {
  name: RankEmblemName;
  size?: number;
  className?: string;
}) {
  return <DesignSystemRankEmblem name={name} size={size} className={className} assetBase="/brand/rank-icons/" />;
}

export function RankShield({
  name,
  size = 32,
  className = "",
}: {
  name: RankEmblemName;
  size?: number;
  className?: string;
}) {
  return <DesignSystemRankShield name={name} size={size} className={className} />;
}

export function MemberRankLabel({ earned }: { earned: number }) {
  const rank = earned >= 100 ? "leopard-vip" : earned >= 40 ? "royal-king" : "cyber-start";
  const isVip = rank === "leopard-vip";
  const isNew = rank === "cyber-start";
  const hasTierCrown = earned >= 40;
  const tierArt = isVip
    ? { src: "/brand/artwork/member-vip.webp", width: 1200, height: 249 }
    : isNew
      ? { src: "/brand/artwork/member-new.webp", width: 1200, height: 249 }
      : { src: "/brand/artwork/member-collecting.webp", width: 1083, height: 395 };
  return (
    <p className={`member-tier member-tier--${rank}`}>
      <RankShield name={rank} size={28} />
      {hasTierCrown && <MotionBadge name="vip-crown-shimmer" size={24} assetBase="/brand/v4" />}
      <Image
        src={tierArt.src}
        alt=""
        aria-hidden="true"
        width={tierArt.width}
        height={tierArt.height}
        className={`member-tier__art${isVip ? " member-tier__art--vip" : isNew ? " member-tier__art--new" : ""}`}
        sizes="(max-width: 430px) 120px, 140px"
      />
      <span>ระดับ {gradeFor(earned)}</span>
    </p>
  );
}
