import Image from "next/image";
import { gradeFor } from "./loyalty-api";

export type RankEmblemName =
  | "royal-king"
  | "leopard-vip"
  | "nature-green"
  | "organic-premium"
  | "diamond-member"
  | "cyber-start"
  | "inferno-power"
  | "cosmic-world"
  | "dragon-emperor"
  | "ultimate-legend";

const EMBLEMS: Record<RankEmblemName, string> = {
  "royal-king": "/brand/rank-icons/royal-king.webp",
  "leopard-vip": "/brand/rank-icons/leopard-vip.webp",
  "nature-green": "/brand/rank-icons/nature-green.webp",
  "organic-premium": "/brand/rank-icons/organic-premium.webp",
  "diamond-member": "/brand/rank-icons/diamond-member.webp",
  "cyber-start": "/brand/rank-icons/cyber-start.webp",
  "inferno-power": "/brand/rank-icons/inferno-power.webp",
  "cosmic-world": "/brand/rank-icons/cosmic-world.webp",
  "dragon-emperor": "/brand/rank-icons/dragon-emperor.webp",
  "ultimate-legend": "/brand/rank-icons/ultimate-legend.webp",
};

export function RankEmblem({
  name,
  size = 24,
  className = "",
}: {
  name: RankEmblemName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`rank-emblem rank-emblem--${name} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image src={EMBLEMS[name]} alt="" width={256} height={256} sizes={`${size}px`} />
    </span>
  );
}

export function MemberRankLabel({ earned }: { earned: number }) {
  const rank = earned >= 100 ? "leopard-vip" : earned >= 40 ? "royal-king" : "cyber-start";
  return (
    <p className={`member-tier member-tier--${rank}`}>
      <RankEmblem name={rank} size={24} />
      <span>ระดับ {gradeFor(earned)}</span>
    </p>
  );
}
