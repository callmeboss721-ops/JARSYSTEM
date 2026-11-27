"use client";

import { useEffect, useRef, useState } from "react";

export const BRAND_V4_MOTIONS = [
  "stamp-pulse",
  "qr-scanner-sweep",
  "vip-crown-shimmer",
  "open-24h-beacon",
  "reward-unlock",
] as const;

export type BrandV4MotionName = (typeof BRAND_V4_MOTIONS)[number];

const DEFAULT_ASSET_BASE = "/jaguar-spk-design-system/brand/v4";
const DEFAULT_STAMP_ASSET_BASE = "/jaguar-spk-design-system/ui/stamps";

const MOTION_ASSETS: Record<BrandV4MotionName, { video: string; fallback: string }> = {
  "stamp-pulse": {
    video: "webm/01-stamp-pulse.webm",
    fallback: "png/128/stamp-coin.png",
  },
  "qr-scanner-sweep": {
    video: "webm/02-qr-scanner-sweep.webm",
    fallback: "png/128/qr-scan.png",
  },
  "vip-crown-shimmer": {
    video: "webm/03-vip-crown-shimmer.webm",
    fallback: "png/128/crown-vip.png",
  },
  "open-24h-beacon": {
    video: "webm/04-open-24h-beacon.webm",
    fallback: "png/128/delivery-24h.png",
  },
  "reward-unlock": {
    video: "reward-unlock-2026.webm",
    fallback: "stamp-coin-kratom-256.webp",
  },
};

function mediaPath(assetBase: string, path: string) {
  return `${assetBase.replace(/\/+$/, "")}/${path}`;
}

export function MotionBadge({
  name,
  alt = "",
  size = 48,
  className = "",
  assetBase,
  fallbackSrc,
  active = true,
}: {
  name: BrandV4MotionName;
  alt?: string;
  size?: number;
  className?: string;
  assetBase?: string;
  fallbackSrc?: string;
  active?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const media = MOTION_ASSETS[name];
  const resolvedAssetBase = assetBase ?? (name === "reward-unlock" ? DEFAULT_STAMP_ASSET_BASE : DEFAULT_ASSET_BASE);
  const resolvedFallbackSrc = fallbackSrc ?? mediaPath(resolvedAssetBase, media.fallback);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!active || prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video || !video.canPlayType('video/webm; codecs="vp9"')) {
      setVideoUnavailable(true);
    }
  }, [active, prefersReducedMotion]);

  const showVideo = active && !prefersReducedMotion && !videoUnavailable;
  const accessibleLabel = alt
    ? { role: "img" as const, "aria-label": alt }
    : { "aria-hidden": true as const };

  return (
    <span
      className={`motion-badge ${className}`.trim()}
      data-motion={name}
      style={{ width: size, height: size }}
      {...accessibleLabel}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className="motion-badge__media"
          autoPlay
          loop
          muted
          playsInline
          poster={resolvedFallbackSrc}
          onError={() => setVideoUnavailable(true)}
          aria-hidden="true"
        >
          <source src={mediaPath(resolvedAssetBase, media.video)} type='video/webm; codecs="vp9"' />
        </video>
      ) : (
        <img
          className="motion-badge__media"
          src={resolvedFallbackSrc}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
        />
      )}
    </span>
  );
}
