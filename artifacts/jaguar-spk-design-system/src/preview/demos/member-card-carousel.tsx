import { useState } from "react";
import { MemberCardFaces, type MemberClub } from "../../components/ui/membership-cards";
import { MemberCardCarousel } from "../../components/ui/member-card-carousel";

export function MemberCardCarouselDemo() {
  const [active, setActive] = useState<MemberClub>("kratom");
  return (
    <div className="ds-demo-stack">
      <MemberCardCarousel active={active} onNavigate={(path) => setActive(path.includes("cannabis") ? "cannabis" : "kratom")}>
        <MemberCardFaces kind={active} memberCode="JAGUAR06" balance={6} />
      </MemberCardCarousel>
      <p className="ds-demo-feedback">เลือกแท็บด้วยเมาส์ หรือใช้ปุ่มลูกศรซ้าย/ขวา · ในมือถือสามารถปัดบนบัตรได้</p>
    </div>
  );
}
