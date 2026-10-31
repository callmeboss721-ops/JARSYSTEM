import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Cannabis,
  CheckCircle2,
  Clock,
  History,
  KeyRound,
  Leaf,
  LayoutDashboard,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
  Users,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  members: Users,
  memberSearch: Users,
  cannabis: Cannabis,
  leaf: Leaf,
  lightning: Zap,
  points: Sparkles,
  progress: Stamp,
  rewards: Package,
  redeem: ArrowLeftRight,
  dashboard: LayoutDashboard,
  addPoints: Plus,
  history: History,
  settings: Settings,
  search: Search,
  logout: LogOut,
  location: MapPin,
  continue: ArrowRight,
  security: ShieldAlert,
  error: AlertTriangle,
  retry: RotateCw,
  success: CheckCircle2,
  pending: Clock,
  staffAccess: KeyRound,
  confirm: ShieldCheck,
  add: Plus,
  subtract: Minus,
  close: X,
} satisfies Record<string, LucideIcon>;

export type BrandIconName = keyof typeof ICONS;
type IconTone = "neutral" | "gold" | "emerald" | "danger" | "inherit";

/** Shared outline-icon treatment: verified Lucide exports, one stroke weight and semantic colour. */
export function BrandIcon({
  name,
  size = 18,
  tone = "neutral",
  className,
}: {
  name: BrandIconName;
  size?: number;
  tone?: IconTone;
  className?: string;
}) {
  const Icon = ICONS[name];
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      className={["brand-icon", `brand-icon--${tone}`, className].filter(Boolean).join(" ")}
      size={size}
      strokeWidth={1.8}
    />
  );
}
