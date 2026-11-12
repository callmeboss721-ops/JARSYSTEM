import { HelpCircle, Info, QrCode } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";

const examples = [
  { label: "ข้อมูลสมาชิก", side: "top" as const, icon: Info, description: "ดูรายละเอียดสมาชิก" },
  { label: "สแกน QR", side: "right" as const, icon: QrCode, description: "แสดงรหัสให้พนักงานสแกน" },
  { label: "ช่วยเหลือ", side: "bottom" as const, icon: HelpCircle, description: "ติดต่อพนักงานเมื่อพบปัญหา" },
];

export function TooltipDemo() {
  return (
    <section className="ds-glass ds-tooltip-sample">
      <span className="ds-type-label">HOVER · KEYBOARD FOCUS · RADIX PORTAL</span>
      <TooltipProvider delayDuration={180}>
        <div className="ds-button-row">
          {examples.map(({ label, side, icon: Icon, description }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="outline" aria-label={label}><Icon aria-hidden="true" />{label}</Button>
              </TooltipTrigger>
              <TooltipContent side={side}>{description}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <p className="ds-demo-feedback">โฟกัสด้วย Tab แล้วกด Enter หรือเลื่อนเมาส์เพื่อดูคำอธิบาย</p>
    </section>
  );
}
