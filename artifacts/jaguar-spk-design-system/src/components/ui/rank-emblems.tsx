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
  "royal-king": "royal-king.webp",
  "leopard-vip": "leopard-vip.webp",
  "nature-green": "nature-green.webp",
  "organic-premium": "organic-premium.webp",
  "diamond-member": "diamond-member.webp",
  "cyber-start": "cyber-start.webp",
  "inferno-power": "inferno-power.webp",
  "cosmic-world": "cosmic-world.webp",
  "dragon-emperor": "dragon-emperor.webp",
  "ultimate-legend": "ultimate-legend.webp",
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
      <img
        src={`${import.meta.env.BASE_URL}brand/rank-icons/${EMBLEMS[name]}`}
        alt=""
        width={size}
        height={size}
      />
    </span>
  );
}

export function MemberRankLabel({ earned }: { earned: number }) {
  const rank: RankEmblemName = earned >= 100 ? "leopard-vip" : earned >= 40 ? "royal-king" : "cyber-start";
  const label = earned >= 100 ? "Black VIP" : earned >= 40 ? "Gold" : "Green Card / สมาชิกใหม่";
  return (
    <p className={`member-tier member-tier--${rank}`}>
      <RankEmblem name={rank} size={24} />
      <span>ระดับ {label}</span>
    </p>
  );
}
