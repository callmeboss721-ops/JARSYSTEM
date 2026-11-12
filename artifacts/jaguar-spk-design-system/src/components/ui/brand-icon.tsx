import {
  Cannabis,
  Leaf,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { ArrowLeftRightGlassIcon } from "@thesvg/ui-react/arrow-left-right";
import { ArrowRightGlassIcon } from "@thesvg/ui-react/arrow-right";
import { AwardGlassIcon } from "@thesvg/ui-react/award";
import { CircleCheckGlassIcon } from "@thesvg/ui-react/circle-check";
import { CirclePlusGlassIcon } from "@thesvg/ui-react/circle-plus";
import { ClockGlassIcon } from "@thesvg/ui-react/clock";
import { CrownGlassIcon } from "@thesvg/ui-react/crown";
import { GiftGlassIcon } from "@thesvg/ui-react/gift";
import { KeyGlassIcon } from "@thesvg/ui-react/key";
import { LayoutDashboardGlassIcon } from "@thesvg/ui-react/layout-dashboard";
import { LogOutGlassIcon } from "@thesvg/ui-react/log-out";
import { MinusGlassIcon } from "@thesvg/ui-react/minus";
import { PinGlassIcon } from "@thesvg/ui-react/pin";
import { PlusGlassIcon } from "@thesvg/ui-react/plus";
import { QrCodeGlassIcon } from "@thesvg/ui-react/qr-code";
import { RefreshCwGlassIcon } from "@thesvg/ui-react/refresh-cw";
import { SearchGlassIcon } from "@thesvg/ui-react/search";
import { SettingsGlassIcon } from "@thesvg/ui-react/settings";
import { ShieldAlertGlassIcon } from "@thesvg/ui-react/shield-alert";
import { ShieldCheckGlassIcon } from "@thesvg/ui-react/shield-check";
import { SparklesGlassIcon } from "@thesvg/ui-react/sparkles";
import { SproutGlassIcon } from "@thesvg/ui-react/sprout";
import { TriangleAlertGlassIcon } from "@thesvg/ui-react/triangle-alert";
import { UserRoundGlassIcon } from "@thesvg/ui-react/user-round";
import { UsersGlassIcon } from "@thesvg/ui-react/users";
import { XGlassIcon } from "@thesvg/ui-react/x";
import { ZapGlassIcon } from "@thesvg/ui-react/zap";

export type BrandIconName =
  | "members" | "memberSearch" | "cannabis" | "leaf" | "sprout" | "lightning" | "points" | "progress"
  | "rewards" | "redeem" | "dashboard" | "addPoints" | "history" | "settings" | "search"
  | "logout" | "location" | "continue" | "security" | "banking" | "error" | "retry" | "success"
  | "pending" | "staffAccess" | "confirm" | "add" | "subtract" | "close" | "qr" | "crown";

const LUCIDE_ICONS: Partial<Record<BrandIconName, LucideIcon>> = {
  cannabis: Cannabis,
  leaf: Leaf,
  banking: Landmark,
};

type IconTone = "neutral" | "gold" | "emerald" | "danger" | "inherit";

const GLASS_ICONS: Partial<Record<BrandIconName, typeof UsersGlassIcon>> = {
  members: UsersGlassIcon,
  memberSearch: UserRoundGlassIcon,
  lightning: ZapGlassIcon,
  points: SparklesGlassIcon,
  progress: AwardGlassIcon,
  rewards: GiftGlassIcon,
  sprout: SproutGlassIcon,
  redeem: ArrowLeftRightGlassIcon,
  dashboard: LayoutDashboardGlassIcon,
  addPoints: CirclePlusGlassIcon,
  history: ClockGlassIcon,
  settings: SettingsGlassIcon,
  search: SearchGlassIcon,
  logout: LogOutGlassIcon,
  location: PinGlassIcon,
  continue: ArrowRightGlassIcon,
  security: ShieldAlertGlassIcon,
  error: TriangleAlertGlassIcon,
  retry: RefreshCwGlassIcon,
  success: CircleCheckGlassIcon,
  pending: ClockGlassIcon,
  staffAccess: KeyGlassIcon,
  confirm: ShieldCheckGlassIcon,
  add: PlusGlassIcon,
  subtract: MinusGlassIcon,
  close: XGlassIcon,
  qr: QrCodeGlassIcon,
  crown: CrownGlassIcon,
};

/** Glass UI icons from theSVG; botanical marks keep their dedicated leaf shapes. */
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
  const GlassIcon = GLASS_ICONS[name];
  const classes = ["brand-icon", `brand-icon--${tone}`, className].filter(Boolean).join(" ");
  if (GlassIcon) {
    return <GlassIcon aria-hidden="true" focusable="false" className={classes} size={size} shadow={tone === "neutral" ? 0.08 : 0.14} />;
  }
  const Icon = LUCIDE_ICONS[name];
  if (!Icon) return null;
  return <Icon aria-hidden="true" focusable="false" className={classes} size={size} strokeWidth={1.8} />;
}
