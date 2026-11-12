const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function PinPad({
  value,
  onChange,
  max = 12,
  tone = "green",
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  max?: number;
  tone?: "green" | "gold";
  label: string;
}) {
  return (
    <div className={`pin-pad pin-pad--${tone}`} role="group" aria-label={label}>
      <div className="pin-dots" aria-hidden="true">
        {Array.from({ length: Math.max(4, Math.min(max, value.length + 1)) }, (_, index) => (
          <span key={index} data-on={index < value.length} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">ป้อนแล้ว {value.length} หลัก</p>
      <div className="pin-pad__keys">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="pin-key"
            aria-label={key === "clear" ? "ล้าง PIN" : key === "back" ? "ลบตัวสุดท้าย" : `เลข ${key}`}
            disabled={(key === "back" || key === "clear") ? !value : value.length >= max}
            onClick={() => onChange(key === "clear" ? "" : key === "back" ? value.slice(0, -1) : (value + key).slice(0, max))}
          >
            {key === "clear" ? "ล้าง" : key === "back" ? "ลบ" : key}
          </button>
        ))}
      </div>
    </div>
  );
}
