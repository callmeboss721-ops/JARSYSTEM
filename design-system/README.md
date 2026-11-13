# JAGUAR SPK Design System v3

ระบบดีไซน์สำหรับเว็บแอป JAGUAR SPK DRINK (ระบบสะสมแต้ม / สิทธิประโยชน์สมาชิก)
เวอร์ชัน 3 ระดับพรีเมียม อนุมัติใช้งานจริงโดยเจ้าของโครงการ

## ไฟล์ในชุดนี้

| ไฟล์ | ความหมาย |
| --- | --- |
| `tokens.css` | Design tokens ทั้งหมด (สี, รัศมี, ease, ขนาด tap target) โหลดก่อนไฟล์อื่น |
| `components.css` | สไตล์คอมโพเนนต์: ปุ่ม, icon grid, Collecting Track, Member Rank, tab bar, toast, dropdown, focus/reduced-motion |
| `icons.svg` | SVG sprite 49 ไอคอน (24x24 viewBox, stroke 1.75) ใช้ผ่าน `<use href="icons.svg#spk-NAME">` |
| `preview.html` | ตัวอย่างอินเทอร์แอกทีฟเต็มรูปแบบ (เปิดในเบราว์เซอร์ได้ทันที ไม่ต้อง build) |

## วิธีใช้งานเริ่มต้น

```html
<link rel="stylesheet" href="design-system/tokens.css" />
<link rel="stylesheet" href="design-system/components.css" />

<!-- ไอคอน: วาง sprite ครั้งเดียวต่อหน้า แล้วอ้างผ่าน use -->
<div data-sprite></div>
<script>
  fetch('design-system/icons.svg')
    .then(r => r.text())
    .then(t => { document.querySelector('[data-sprite]').innerHTML = t; });
</script>

<svg class="ic" width="24" height="24" aria-hidden="true"><use href="#spk-member"></use></svg>
```

## Design tokens หลัก

- พื้นหลัง: `--bg:#050505`, พื้นผิวเขียวเข้ม `--surface:#0D140F`
- นีออนเขียว: `--neon:#00FF9D` (บัตรกัญชา / สถานะ active)
- ทอง: `--gold:#D4AF37`, `--gold-2:#E5C04A` (บัตรกระท่อม / ระดับสมาชิกสูง)
- ข้อความ: `--text:#F9F6E7` (และระดับจาง 70% / 45%)
- เส้นขอบบาง: `--line`, เส้นเรืองแสง: `--neon-line`, `--gold-line`
- สถานะ: `--danger:#FF5A5A`, `--warn:#FFC24B`

## องค์ประกอบหลัก

1. Icon system: 49 ไอคอนเส้น 24x24, สถานะ default / active / disabled / error, อ่านชัดที่ 16/20/24px
2. Action buttons: primary, secondary, icon, toggle, danger ครบสถานะ default / hover / pressed / focus / loading / disabled
3. Collecting Track: 10 ช่องสะสม, accent นีออน (กัญชา) และทอง (กระท่อม), โครงสร้างเดียวกัน, สถานะเต็ม/ว่างไม่อิงสีเพียงอย่างเดียว
4. Member Rank: 10 ระดับตามระบบเดิม (Royal King, Leopard VIP, Nature Green, Organic Premium, Diamond Member, Cyber Start, Inferno Power, Cosmic World, Dragon Emperor, Ultimate Legend)

## ข้อกำหนดคุณภาพ

- รองรับหน้าจอ 375 / 768 / 1280px
- รองรับ `prefers-reduced-motion`
- ทุกปุ่มมี focus state และใช้คีย์บอร์ดได้, tap target ไม่ต่ำกว่า 44px
- ห้ามใช้อิโมจิเป็นไอคอน, ห้ามแก้โลโก้ Jaguar

## เครดิตไอคอน

Glyph ทั้งหมดดัดแปลงจาก [theSVG](https://github.com/glincker/thesvg) (MIT License)
ตามข้อกำหนดของสัญญาอนุญาต ต้องระบุเครดิตนี้ไว้ในผลงานที่เผยแพร่

## ขอบเขตการใช้งาน (สำคัญ)

- ชุดนี้แยกจากตัวแอปหลัก ห้ามผูกกับ routes, ระบบเข้าสู่ระบบ, Supabase, ข้อมูลสมาชิก หรือกติกาคะแนน
- การนำไปใช้กับหน้าจอหลักของแอปต้องได้รับอนุมัติจากเจ้าของโครงการเป็นรายส่วน
