"use client";

import { PinPad as DesignSystemPinPad } from "@workspace/jaguar-spk-design-system/components/ui/pin-pad";

export function PinPad({ value, onChange, max = 12, tone = "green", label }: { value: string; onChange: (v: string) => void; max?: number; tone?: "green" | "gold"; label: string }) {
  return <DesignSystemPinPad value={value} onChange={onChange} max={max} tone={tone} label={label} />;
}
