import { JaguarMark as DesignSystemJaguarMark, PawGlyph } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";

type Props = { size?: number; className?: string; animated?: boolean; title?: string };

/** App adapter keeps the original supplied mark from the app's public assets. */
export function JaguarMark({ size = 40, className, title }: Props) {
  return <DesignSystemJaguarMark src="/brand/jaguar-spk-emblem-crisp.webp" size={size} className={className} title={title} />;
}

export { PawGlyph };
