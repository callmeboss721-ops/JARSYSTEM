import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ToastAction } from "../../components/ui/toast";
import { Toaster } from "../../components/ui/toaster";
import { toast } from "../../hooks/use-toast";

export function ToastFeedbackDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-toast-sample">
        <span className="ds-type-label">TOAST · DISMISS · ACTION · LIVE ANNOUNCEMENT</span>
        <div className="ds-button-row">
          <Button onClick={() => toast({ title: "บันทึกสำเร็จ", description: "ยอดแต้มสมาชิกอัปเดตแล้ว" })}>
            <CheckCircle2 aria-hidden="true" /> สำเร็จ
          </Button>
          <Button variant="destructive" onClick={() => toast({
            title: "ทำรายการไม่สำเร็จ",
            description: "ตรวจสอบข้อมูลแล้วลองอีกครั้ง",
            variant: "destructive",
            action: <ToastAction altText="ลองอีกครั้ง">ลองอีกครั้ง</ToastAction>,
          })}>
            <TriangleAlert aria-hidden="true" /> เกิดข้อผิดพลาด
          </Button>
        </div>
        <p className="ds-demo-feedback">แจ้งเตือนอยู่มุมล่างขวาบนจอใหญ่ และด้านบนบนจอเล็ก · ปัดเพื่อปิดได้</p>
      </section>
      <Toaster />
    </div>
  );
}
