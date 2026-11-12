import { MemberRankLabel, RankEmblem, type RankEmblemName } from "../../components/ui/rank-emblems";

const ranks: Array<{ name: RankEmblemName; label: string }> = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
  { name: "organic-premium", label: "Organic Premium" },
  { name: "diamond-member", label: "Diamond Member" },
  { name: "cyber-start", label: "Cyber Start" },
  { name: "inferno-power", label: "Inferno Power" },
  { name: "cosmic-world", label: "Cosmic World" },
  { name: "dragon-emperor", label: "Dragon Emperor" },
  { name: "ultimate-legend", label: "Ultimate Legend" },
];

export function RankEmblemsDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-rank-grid ds-glass">
        {ranks.map((rank) => (
          <div className="ds-rank-card" key={rank.name}>
            <RankEmblem name={rank.name} size={56} />
            <span>{rank.label}</span>
          </div>
        ))}
      </section>
      <section className="ds-glass ds-rank-label">
        <span className="ds-type-label">DYNAMIC TIER LABEL</span>
        <MemberRankLabel earned={12} />
        <MemberRankLabel earned={52} />
        <MemberRankLabel earned={110} />
      </section>
    </div>
  );
}
