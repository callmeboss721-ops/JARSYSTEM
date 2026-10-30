"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function PinPad({ value, onChange, max = 12, tone = "green", label }: { value: string; onChange: (v: string) => void; max?: number; tone?: "green" | "gold"; label: string }) {
  return (
    <div className={`pin-pad pin-pad--${tone}`} role="group" aria-label={label}>
      <div className="pin-dots" aria-hidden="true">
        {Array.from({ length: Math.max(4, Math.min(max, value.length + 1)) }, (_, i) => <span key={i} data-on={i < value.length} />)}
      </div>
      <p className="sr-only" aria-live="polite">ป้อนแล้ว {value.length} หลัก</p>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="pin-key"
            aria-label={k === "clear" ? "ล้าง PIN" : k === "back" ? "ลบตัวสุดท้าย" : `เลข ${k}`}
            disabled={(k === "back" || k === "clear") ? !value : value.length >= max}
            onClick={() => onChange(k === "clear" ? "" : k === "back" ? value.slice(0, -1) : (value + k).slice(0, max))}
          >
            {k === "clear" ? "ล้าง" : k === "back" ? "ลบ" : k}
          </button>
        ))}
      </div>
    </div>
  );
}
