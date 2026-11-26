# JAGUAR SPK v4 motion badge

`MotionBadge` maps the four approved alpha WebM animations to their static PNG
fallbacks. It plays muted, inline, and in a loop when motion is allowed and WebM
VP9 playback is available. It switches to the static image for
`prefers-reduced-motion`, inactive states, or playback errors.

```tsx
import { MotionBadge } from "@workspace/jaguar-spk-design-system/components/ui/motion-badge";

<MotionBadge name="open-24h-beacon" alt="ร้านเปิด 24 ชั่วโมง" assetBase="/brand/v4" />;
```

The component does not invent or modify the supplied artwork. Keep motion
decorative and pair any operational status with visible text.
