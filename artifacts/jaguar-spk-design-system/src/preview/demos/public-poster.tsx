import { PublicPoster } from "../../components/ui/public-poster";

export function PublicPosterDemo() {
  return (
    <div className="ds-demo-stack">
      <div className="ds-poster-preview"><PublicPoster /></div>
      <p className="ds-demo-feedback">QR ใช้ URL ปัจจุบัน + /register · ปุ่มพิมพ์จะเปิดหน้าต่างพิมพ์ของเบราว์เซอร์</p>
    </div>
  );
}
