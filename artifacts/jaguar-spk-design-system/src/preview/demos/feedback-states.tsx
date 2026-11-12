import { useState } from "react";
import { EmptyState, ErrorState, LoadingState, LoadingSpinner, Modal, SignedOutState } from "../../components/ui/feedback-states";

export function FeedbackStatesDemo() {
  const [retrying, setRetrying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const retry = () => {
    setRetrying(true);
    window.setTimeout(() => setRetrying(false), 700);
  };
  return (
    <div className="ds-demo-stack">
      <div className="ds-state-grid">
        <section className="ds-state-sample ds-glass"><span className="ds-type-label">LOADING</span><LoadingState label="กำลังโหลดข้อมูลสมาชิก" /><LoadingState compact label="กำลังบันทึก" /><span className="ds-inline-spinner"><LoadingSpinner /> ปุ่มกำลังทำงาน</span></section>
        <section className="ds-state-sample ds-glass"><span className="ds-type-label">ERROR · RETRY</span><ErrorState message="ไม่สามารถเชื่อมต่อได้ กรุณาลองอีกครั้ง" onRetry={retry} retrying={retrying} /></section>
        <section className="ds-state-sample ds-glass"><span className="ds-type-label">EMPTY</span><EmptyState title="ยังไม่มีข้อมูล" body="รายการใหม่จะแสดงที่นี่เมื่อพร้อมใช้งาน" action={<button type="button" className="btn btn-ghost">เริ่มค้นหา</button>} /></section>
        <section className="ds-state-sample ds-glass"><span className="ds-type-label">SIGNED OUT</span><SignedOutState loginHref={import.meta.env.BASE_URL} registerHref={import.meta.env.BASE_URL} /></section>
      </div>
      <section className="ds-glass ds-modal-launch">
        <span className="ds-type-label">MODAL · ESCAPE / FOCUS TRAP / BACKDROP</span>
        <button type="button" className="btn btn-gold" onClick={() => setModalOpen(true)}>เปิดหน้าต่างยืนยัน</button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="ds-modal-title">
          <h2 id="ds-modal-title">ยืนยันการทำรายการ</h2>
          <p>กด Escape, ปุ่มปิด หรือพื้นหลังเพื่อปิดหน้าต่าง</p>
          <button type="button" className="btn btn-gold" data-autofocus onClick={() => setModalOpen(false)}>ยืนยัน</button>
        </Modal>
      </section>
    </div>
  );
}
