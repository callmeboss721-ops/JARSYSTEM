import {
  Crown,
  Diamond,
  Flame,
  Gem,
  Globe,
  Leaf,
  Sprout,
  Star,
  Swords,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

const SHIELD_STYLE: Record<RankEmblemName, { color: string; level: number; ticks: number; icon: LucideIcon }> = {
  "royal-king": { color: "#E5C04A", level: 10, ticks: 5, icon: Diamond },
  "leopard-vip": { color: "#FFD866", level: 9, ticks: 5, icon: Crown },
  "nature-green": { color: "#00FF9D", level: 8, ticks: 4, icon: Sprout },
  "organic-premium": { color: "#7CE87C", level: 7, ticks: 4, icon: Leaf },
  "diamond-member": { color: "#9BE8FF", level: 6, ticks: 3, icon: Gem },
  "cyber-start": { color: "#7FD4FF", level: 5, ticks: 3, icon: Zap },
  "inferno-power": { color: "#FF7A5A", level: 4, ticks: 2, icon: Flame },
  "cosmic-world": { color: "#C79BFF", level: 3, ticks: 2, icon: Globe },
  "dragon-emperor": { color: "#FF9D5C", level: 2, ticks: 1, icon: Swords },
  "ultimate-legend": { color: "#C9CDD6", level: 1, ticks: 1, icon: Star },
};

export function RankEmblem({
  name,
  size = 24,
  className = "",
  assetBase = "/jaguar-spk-design-system/brand/rank-icons/",
}: {
  name: RankEmblemName;
  size?: number;
  className?: string;
  assetBase?: string;
}) {
  return (
    <span
      className={`rank-emblem rank-emblem--${name} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={`${assetBase}${EMBLEMS[name]}`}
        alt=""
        width={size}
        height={size}
      />
    </span>
  );
}

/** New v3 shield treatment; the original RankEmblem artwork/API remains available. */
export function RankShield({
  name,
  size = 48,
  className = "",
}: {
  name: RankEmblemName;
  size?: number;
  className?: string;
}) {
  const style = SHIELD_STYLE[name];
  const Icon = style.icon;
  return (
    <span
      className={`rank-shield rank-shield--${name} ${className}`.trim()}
      style={{ width: size, height: size, color: style.color }}
      data-level={style.level}
      aria-hidden="true"
    >
      <svg className="rank-shield__frame" viewBox="0 0 48 48" fill="none">
        <path d="M24 3 42 9v14c0 11-7.5 18.5-18 22C13.5 41.5 6 34 6 23V9Z" fill="#0D140F" stroke="currentColor" strokeWidth="2" />
        <path d="M24 7.5 38 12v11c0 8.8-5.9 14.9-14 17.8C15.9 37.9 10 31.8 10 23V12Z" stroke="currentColor" strokeWidth="1" opacity=".45" />
        {Array.from({ length: style.ticks }, (_, index) => {
          const y = 31 - index * 3.2;
          return <path key={index} d={`M20 ${y}h8`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.95 - index * 0.14} />;
        })}
      </svg>
      <Icon className="rank-shield__glyph" size={Math.max(12, Math.round(size * 0.34))} strokeWidth={1.75} />
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
