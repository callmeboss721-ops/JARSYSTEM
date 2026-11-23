import Image from "next/image";
import { JaguarMark as DesignSystemJaguarMark, PawGlyph } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";

type Props = { size?: number; className?: string; animated?: boolean; title?: string };

/** App adapter keeps the original supplied mark from the app's public assets. */
export function JaguarMark({ size = 40, className, title }: Props) {
  return (
    <span className={`jaguar-mark-composition${className ? ` ${className}` : ""}`} style={{ width: size, height: size }}>
      <DesignSystemJaguarMark src="/brand/jaguar-spk-emblem-crisp.webp" size={size} title={title} />
      <Image
        src="/brand/jaguar-spk-mascot-face.webp"
        alt=""
        aria-hidden="true"
        width={96}
        height={96}
        className="jaguar-mark-composition__mascot"
        sizes={`${Math.round(size * 0.42)}px`}
      />
    </span>
  );
}

export { PawGlyph };
