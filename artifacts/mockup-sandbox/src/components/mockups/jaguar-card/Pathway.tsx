import { useState } from "react";
import "./_group.css";
import { BrandEmblem } from "./_shared/brand-emblem";

const balance = 6;
const memberCode = "SAMPLE-01";
const stampCount = 10;

function SampleQr() {
  const cells = [
    "111110010111111",
    "100010110100001",
    "101010001101101",
    "100010110100001",
    "111110101111111",
    "000001001000000",
    "110101111010110",
    "001110010111000",
    "111001101001101",
    "010110011100010",
    "111110100110101",
    "100010011001010",
    "101010110100101",
    "100010001011010",
    "111110110101111",
  ];

  return (
    <span className="pathway-qr" role="img" aria-label="QR ตัวอย่าง ใช้สแกนไม่ได้">
      {cells.map((row, y) =>
        [...row].map((cell, x) =>
          cell === "1" ? <i key={`${x}-${y}`} style={{ gridColumn: x + 1, gridRow: y + 1 }} /> : null,
        ),
      )}
    </span>
  );
}

export function Pathway() {
  const [view, setView] = useState<"journey" | "counter">("journey");
  const remaining = Math.max(stampCount - balance, 0);

  return (
    <main className="mockup-surface pathway-surface">
      <section className="pathway-panel" aria-label="บัตรสมาชิก JAGUAR ตัวอย่าง">
        <header className="pathway-topline">
          <p className="pathway-overline">JAGUAR MEMBER</p>
          <span className="pathway-demo">ข้อมูลตัวอย่าง</span>
        </header>

        <div className="pathway-identity">
          <div>
            <p className="pathway-location">SAMUT PRAKAN · SOI 6</p>
            <h1>Jaguar Kratom</h1>
            <p className="pathway-code">รหัสสมาชิก <span>{memberCode}</span></p>
          </div>
          <BrandEmblem variant="card" />
        </div>

        <div className="pathway-switch" role="tablist" aria-label="มุมมองบัตรสมาชิก">
          <button
            type="button"
            role="tab"
            aria-selected={view === "journey"}
            className={view === "journey" ? "is-active" : ""}
            onClick={() => setView("journey")}
          >
            ความคืบหน้า
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "counter"}
            className={view === "counter" ? "is-active" : ""}
            onClick={() => setView("counter")}
          >
            แสดงที่เคาน์เตอร์
          </button>
        </div>

        {view === "journey" ? (
          <section className="pathway-content" role="tabpanel" aria-label="ความคืบหน้าการสะสม">
            <div className="pathway-balance">
              <div>
                <p className="pathway-label">แต้มคงเหลือ</p>
                <p className="pathway-number">{balance}</p>
              </div>
              <div className="pathway-next">
                <span className="pathway-next-mark" aria-hidden="true">✦</span>
                <p><strong>{remaining} แต้ม</strong><br />ถึงครบ 10 แต้ม</p>
              </div>
            </div>

            <div className="pathway-track-heading">
              <span>เส้นทางสะสมแต้ม</span>
              <span className="pathway-count">{balance}/{stampCount}</span>
            </div>
            <ol className="pathway-track" aria-label={`สะสมแล้ว ${balance} จาก ${stampCount} แต้ม`}>
              {Array.from({ length: stampCount }, (_, index) => {
                const complete = index < balance;
                return (
                  <li key={index} className={complete ? "is-complete" : ""}>
                    <span aria-hidden="true">{complete ? "✓" : index + 1}</span>
                  </li>
                );
              })}
            </ol>
            <div className="pathway-milestones">
              <span>เริ่มสะสม</span>
              <span>ครบ 10 แต้ม</span>
            </div>
            <p className="pathway-note">แต้มของคุณพร้อมเดินทางต่อในครั้งถัดไป</p>
          </section>
        ) : (
          <section className="pathway-content pathway-counter" role="tabpanel" aria-label="รหัสสมาชิกสำหรับแสดงที่เคาน์เตอร์">
            <p className="pathway-label">ให้พนักงานสแกนรหัสสมาชิก</p>
            <div className="pathway-qr-frame"><SampleQr /></div>
            <p className="pathway-counter-code">{memberCode}</p>
            <p className="pathway-qr-caption">QR ตัวอย่าง · ไม่สามารถใช้สแกนได้</p>
          </section>
        )}

        <footer className="pathway-footer">
          <span className="pathway-status"><i aria-hidden="true" /> สมาชิกใช้งานอยู่</span>
          <span>บัตรสมาชิกดิจิทัล</span>
        </footer>
      </section>

      <style>{`
        .pathway-surface {
          --pathway-gold: #e8be42;
          --pathway-green: #22c572;
          min-height: 100vh;
          padding: 14px;
          justify-content: center;
          background: #090d0b;
          color: #f5f7f5;
        }
        .pathway-panel {
          width: min(100%, 390px);
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #232a26;
          border-radius: 20px;
          background: #101713;
        }
        .pathway-topline, .pathway-identity, .pathway-balance, .pathway-track-heading,
        .pathway-milestones, .pathway-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pathway-topline { margin-bottom: 17px; }
        .pathway-overline, .pathway-location, .pathway-label {
          margin: 0;
          color: #9aa8a0;
        }
        .pathway-overline {
          font: 10px var(--font-mono);
          letter-spacing: .16em;
        }
        .pathway-demo {
          padding: 4px 8px;
          border: 1px solid #39443d;
          border-radius: 999px;
          color: #b5c1b8;
          font-size: 10px;
        }
        .pathway-identity { align-items: flex-start; margin-bottom: 18px; }
        .pathway-location {
          font: 9px var(--font-mono);
          letter-spacing: .1em;
        }
        .pathway-identity h1 {
          margin: 4px 0 6px;
          color: #f5f7f5;
          font: 600 21px/1.2 var(--font-display);
        }
        .pathway-code { margin: 0; color: #9aa8a0; font-size: 11px; }
        .pathway-code span { margin-left: 4px; color: #f5f7f5; font: 11px var(--font-mono); }
        .pathway-identity .brand-emblem--card .brand-emblem__frame {
          width: 56px;
          padding: 3px;
          border: 1px solid #39443d;
          border-radius: 12px;
          background: #090d0b;
        }
        .pathway-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding: 4px;
          border: 1px solid #232a26;
          border-radius: 12px;
          background: #090d0b;
        }
        .pathway-switch button {
          min-height: 44px;
          padding: 8px 6px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #9aa8a0;
          font: 500 12px var(--font-sans);
          cursor: pointer;
        }
        .pathway-switch button.is-active {
          border-color: #3d3826;
          background: #1b2018;
          color: #e8be42;
        }
        .pathway-switch button:focus-visible { outline: 2px solid #a6ff00; outline-offset: 2px; }
        .pathway-content { min-height: 250px; padding-top: 18px; }
        .pathway-balance { align-items: flex-end; margin-bottom: 21px; }
        .pathway-label { font-size: 12px; }
        .pathway-number {
          margin: 0;
          color: #e8be42;
          font: 700 54px/.98 var(--font-display);
          letter-spacing: -.06em;
        }
        .pathway-next {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 11px;
          border: 1px solid #303a32;
          border-radius: 12px;
          background: #16201b;
        }
        .pathway-next-mark { color: #e8be42; font-size: 18px; }
        .pathway-next p { margin: 0; color: #9aa8a0; font-size: 10px; line-height: 1.55; }
        .pathway-next strong { color: #f5f7f5; font-size: 12px; }
        .pathway-track-heading { margin-bottom: 13px; color: #d8ded9; font-size: 12px; }
        .pathway-count { color: #e8be42; font: 12px var(--font-mono); }
        .pathway-track {
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          gap: 5px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .pathway-track li { display: grid; place-items: center; }
        .pathway-track li span {
          display: grid;
          width: 100%;
          aspect-ratio: 1;
          place-items: center;
          border: 1px solid #39443d;
          border-radius: 50%;
          color: #748078;
          font: 9px var(--font-mono);
        }
        .pathway-track li.is-complete span {
          border-color: #63916c;
          background: #1c3527;
          color: #9ce1ad;
        }
        .pathway-milestones { margin-top: 8px; color: #829087; font-size: 10px; }
        .pathway-note {
          margin: 19px 0 0;
          padding-top: 13px;
          border-top: 1px solid #232a26;
          color: #9aa8a0;
          font-size: 11px;
        }
        .pathway-counter {
          display: flex;
          min-height: 250px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 8px;
        }
        .pathway-qr-frame {
          display: grid;
          width: 152px;
          height: 152px;
          place-items: center;
          margin-top: 12px;
          border: 7px solid #fff;
          border-radius: 11px;
          background: #fff;
        }
        .pathway-qr {
          display: grid;
          width: 132px;
          height: 132px;
          grid-template: repeat(15, 1fr) / repeat(15, 1fr);
          background: #fff;
        }
        .pathway-qr i { background: #11150f; }
        .pathway-counter-code { margin: 10px 0 0; color: #f5f7f5; font: 13px var(--font-mono); letter-spacing: .12em; }
        .pathway-qr-caption { margin: 4px 0 0; color: #9aa8a0; font-size: 10px; }
        .pathway-footer {
          padding-top: 14px;
          border-top: 1px solid #232a26;
          color: #829087;
          font-size: 10px;
        }
        .pathway-status { display: inline-flex; align-items: center; gap: 7px; color: #b7c2ba; }
        .pathway-status i { width: 7px; height: 7px; border-radius: 50%; background: #22c572; }
        @media (max-width: 380px) {
          .pathway-panel { padding: 16px; }
          .pathway-track { gap: 3px; }
          .pathway-track li span { font-size: 8px; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .pathway-switch button { transition: background-color .16s ease, color .16s ease; }
        }
      `}</style>
    </main>
  );
}
