import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "../../components/ui/dialog";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "../../components/ui/sheet";

const sides = ["right", "left", "top", "bottom"] as const;

export function DialogSheetDemo() {
  const [side, setSide] = useState<(typeof sides)[number]>("right");
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-dialog-sample">
        <span className="ds-type-label">DIALOG · MODAL · ESCAPE / FOCUS TRAP</span>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline">เปิดรายละเอียด</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>JAGUAR SPK Members Club</DialogTitle>
              <DialogDescription>หน้าต่างยืนยันที่รองรับโฟกัสและคีย์บอร์ด</DialogDescription>
            </DialogHeader>
            <p className="ds-dialog-copy">บัตรสมาชิกแสดงยอดแต้มแยกตามประเภทสินค้า</p>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">ยกเลิก</Button></DialogClose>
              <DialogClose asChild><Button>ตกลง</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      <section className="ds-glass ds-dialog-sample">
        <span className="ds-type-label">SHEET · RIGHT / LEFT / TOP / BOTTOM</span>
        <div className="ds-button-row">
          {sides.map((value) => (
            <Sheet key={value}>
              <SheetTrigger asChild><Button variant="outline" onClick={() => setSide(value)}>{value}</Button></SheetTrigger>
              <SheetContent side={side} className={side === "top" || side === "bottom" ? "max-h-[72vh] overflow-y-auto" : ""}>
                <SheetHeader>
                  <SheetTitle>เมนูสมาชิก</SheetTitle>
                  <SheetDescription>แผงข้อมูลเลื่อนจากด้าน {side}</SheetDescription>
                </SheetHeader>
                <div className="ds-sheet-links"><a href="#card">บัตรสมาชิก</a><a href="#rewards">รางวัล</a><a href="#history">ประวัติ</a></div>
                <SheetFooter><SheetClose asChild><Button>ปิดแผง</Button></SheetClose></SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </section>
    </div>
  );
}
