# ฐานความรู้ JAGUAR SPK สำหรับ NotebookLM และ AI Agent

> เอกสารภาษาไทยสำหรับนำเข้า NotebookLM หรือ AI assistant อื่น ใช้ข้อมูลในเอกสารนี้เป็นบริบทของโปรเจกต์ร้านและแอปสมาชิก JAGUAR SPK โดยตรวจสอบแหล่งข้อมูลและสถานะของแต่ละข้อก่อนนำไปใช้
>
> ตรวจจากโค้ดและเอกสารในโปรเจกต์: 20 พฤศจิกายน 2026

## 🎯 Convention — บริบทและกติกาหลัก

### 1. ภาพรวมร้านและโปรเจกต์

- ชื่อที่ใช้ในโปรเจกต์: **JAGUAR SPK** และ **Jaguar Kratom House**
- ที่ตั้งที่ระบุในเว็บไซต์และแอป: **บุญศิริ ซอย 6 จังหวัดสมุทรปราการ**
- จุดประสงค์ของระบบ: ให้ลูกค้าใช้บัตรสมาชิกดิจิทัลบนมือถือ และให้พนักงานกับเจ้าของร้านจัดการงานหน้าร้าน สมาชิก แต้ม และรางวัล
- กลุ่มผู้ใช้หลัก: ลูกค้าสมาชิก, พนักงานหน้าร้าน และเจ้าของร้าน
- เว็บไซต์เขียนภาษาไทยเป็นหลักและออกแบบให้ใช้บนมือถือได้
- เอกสารนี้อธิบายสิ่งที่พบในโค้ดและเอกสารของโปรเจกต์ ไม่ใช่คำยืนยันข้อมูลทางกฎหมายหรือข้อมูลการดำเนินงานที่ไม่ได้ระบุไว้

**แหล่งหลัก:** `replit.md`, `artifacts/jaguar-house/src/app/page.tsx`, `artifacts/jaguar-house/src/components/brand/welcome.tsx`, `artifacts/jaguar-house/src/app/brand/page.tsx`

### 2. ตัวตนและแนวทางแบรนด์

- ภาพรวมแบรนด์: พรีเมียม สุขุม ทันสมัย อ่านง่าย และเป็นมิตรกับลูกค้าในพื้นที่
- แนวภาพของระบบ: พื้นมืดแบบ obsidian/gunmetal ใช้ทองเป็นสีเน้นหลักและเขียวมรกตเป็นสีรอง หลีกเลี่ยงแสงเรืองมากเกินไป
- ภาษาและตัวอักษร: ภาษาไทยต้องอ่านและตัดบรรทัดได้สบาย ใช้ Bai Jamjuree กับหัวข้อ, IBM Plex Sans Thai กับเนื้อหา และ JetBrains Mono กับรหัสหรือตัวเลข
- ใช้ตราและ wordmark ที่ผู้ใช้ส่งมาให้ในสภาพเดิม แสดงเต็มภาพด้วย `object-contain`; ห้ามครอป วาดใหม่ หรือสร้างตราทดแทน
- Jaguar motif ใช้เป็นรายละเอียดของแบรนด์ ไม่ทำระบบสมาชิกให้กลายเป็นเกมหรือหน้าจอ cyberpunk
- การแต่งภาพต้องไม่บังข้อความหรือทำให้สถานะสำเร็จ/รอ/ผิดพลาดแยกไม่ออก
- ใช้โทเคนและคอมโพเนนต์จาก JAGUAR SPK Design System เมื่อมีให้ใช้ ห้ามสร้างชุดสี ฟอนต์ ระยะ หรือคอมโพเนนต์ซ้ำโดยไม่จำเป็น

**แหล่งหลัก:** `artifacts/jaguar-spk-design-system/docs/AGENTS.md`, `artifacts/jaguar-spk-design-system/docs/consuming-web.md`, `artifacts/jaguar-spk-design-system/tokens.json`, `docs/frontend/jaguar-loyalty-design-guidelines.md`

**หมายเหตุเรื่องเอกสารเก่า:** `artifacts/jaguar-house/DESIGN.md` ยังมีข้อความเดิมว่าระบบไม่มี theme package; ปัจจุบัน `artifacts/jaguar-house/src/app/globals.css` นำเข้า `@workspace/jaguar-spk-design-system/styles.css` แล้ว ให้ยึด design system และ `tokens.json` เป็นแหล่งโทเคนปัจจุบัน

### 3. ภาพรวมระบบปัจจุบัน

- เว็บ: Next.js 15 App Router, React, Tailwind CSS 4 และ React Query
- API: Express 5; สัญญา API อยู่ใน OpenAPI และมี client/schema ที่สร้างจากสัญญา
- ฐานข้อมูลผลิตภัณฑ์: Replit-managed PostgreSQL; schema ใช้ Drizzle
- การตรวจข้อมูล: Zod
- การยืนยันตัวตนของเว็บใช้ signed HttpOnly cookie; ห้ามเก็บข้อมูลเข้าสู่ระบบหรือ credential ใน `localStorage`
- ระบบมีการจำกัดการลองเข้าสู่ระบบและคำขอบางชนิด; rate limit บางส่วนเก็บในหน่วยความจำของ API แต่ละ process จึงอย่าขยายจำนวน API instance โดยไม่ตรวจแนวทาง shared quota ก่อน
- การเปลี่ยนฐานข้อมูลหรือย้ายข้อมูลมีผลต่อยอดสมาชิกและประวัติธุรกรรม ต้องได้รับการยืนยันจากเจ้าของก่อน ห้ามนำเข้าหรือลบข้อมูลเก่าเอง

**ตำแหน่งสำคัญในโปรเจกต์**

| เรื่อง | ตำแหน่ง |
| --- | --- |
| หน้าเว็บและเส้นทาง | `artifacts/jaguar-house/src/app/` |
| คอมโพเนนต์แบรนด์และสมาชิก | `artifacts/jaguar-house/src/components/brand/` |
| Theme ของแอป | `artifacts/jaguar-house/src/app/globals.css` |
| Design system และโทเคน | `artifacts/jaguar-spk-design-system/` |
| API สำหรับ loyalty | `artifacts/api-server/src/routes/loyalty.ts` |
| Logic การทำรายการและแต้ม | `artifacts/api-server/src/lib/loyalty-store.ts`, `artifacts/api-server/src/lib/points-policy.ts` |
| Schema ฐานข้อมูล | `lib/db/src/schema/` |
| สัญญา API ต้นทาง | `lib/api-spec/openapi.yaml` |
| ภาพแบรนด์ที่เว็บเรียกใช้ | `artifacts/jaguar-house/public/brand/` และ `public/ui/` |

### 4. เส้นทางเว็บและหน้าที่

| เส้นทาง | หน้าที่ |
| --- | --- |
| `/` | หน้าแรก แนะนำร้าน สินค้าที่แสดงในเว็บ สมาชิก และช่องทางติดต่อ |
| `/brand` | หน้าแนะนำแบรนด์ JAGUAR SPK |
| `/login` | เข้าสู่ระบบสมาชิก; เปลี่ยนเป็นสมัครสมาชิกได้ด้วย `?mode=register` |
| `/register` | เปลี่ยนเส้นทางไป `/login?mode=register` |
| `/card` | บัตรสมาชิกหลัก |
| `/card/cannabis` | เส้นทางบัตรสมาชิกกัญชา; ใช้หน้าร่วมกับ `/cannabis-card` |
| `/cannabis-card` | หน้าบัตรสมาชิกกัญชา |
| `/redeem` | ดูและส่งคำขอแลกรางวัล |
| `/staff` | เครื่องมือพนักงานและงานเคาน์เตอร์ |
| `/owner` | เครื่องมือเจ้าของร้านและภาพรวมการดำเนินงาน |
| `/admin` | เส้นทางเข้ากันได้ย้อนหลัง; เปลี่ยนไป `/owner` หรือ `/staff` ตาม query |

หน้า `/card` และ `/card/cannabis` เป็นหน้าที่ต้องมี session สมาชิก ส่วน `/staff` และ `/owner` แยกสิทธิ์ตามบทบาท ดูการตั้งค่าระบบและ API ได้จาก `replit.md` กับ `artifacts/api-server/src/routes/loyalty.ts`

### 5. การเข้าสู่ระบบและการคุ้มครองข้อมูล

- แบบฟอร์มและ API ปัจจุบันรองรับให้สมาชิกเลือกใช้ **เบอร์โทร, รหัสสมาชิก หรือชื่อเล่น** อย่างใดอย่างหนึ่ง
- การเข้าสู่ระบบสมาชิกไม่มี OTP หรือปัจจัยยืนยันตัวตนชั้นที่สอง จึงไม่ควรอธิบายว่าเป็นการยืนยันตัวตนระดับสูง
- รหัสสมาชิกมีไว้สำหรับเข้าสู่บัญชี; QR ที่พนักงานสแกนเป็น token แยกต่างหาก อย่าใช้แทนกัน
- พนักงานและเจ้าของร้านใช้ PIN แยกบทบาท การเปลี่ยน PIN มีผลกับ session เดิม
- ห้ามใส่ PIN, password, token, secret, connection string หรือข้อมูลส่วนบุคคลของสมาชิกในฐานความรู้, prompt, log หรือตัวอย่าง
- ใช้ข้อมูลสมาชิกจริงเฉพาะเมื่อระบบและสิทธิ์อนุญาต; ห้ามนำข้อมูลจริงไปทำตัวอย่างหรือคำตอบสาธารณะ

**หมายเหตุเรื่องเอกสารเก่า:** `replit.md` ยังเขียนว่าใช้ member-code-only login แต่โค้ดปัจจุบันใน `artifacts/jaguar-house/src/components/brand/auth-forms.tsx` และ `artifacts/api-server/src/routes/loyalty.ts` รองรับสามวิธีข้างต้น ให้ยึดการทำงานจริงในโค้ดและขอเจ้าของยืนยันก่อนเปลี่ยนนโยบาย

### 6. แต้ม การขาย และข้อมูลที่ต้องไม่แต่งขึ้น

**กติกาที่สอดคล้องกับโค้ดปัจจุบันและบันทึกนโยบายเจ้าของ**

- กระท่อม: แต้มคำนวณจากยอดใช้จ่ายสะสม ทุก ๆ **100 บาท** ที่เข้าเกณฑ์ได้ 1 แต้ม และเก็บเศษยอดไว้ต่อ ไม่เริ่มเศษใหม่ทุกบิล
- กัญชา: แต้มคำนวณจากน้ำหนักสะสม ทุก ๆ **100 กรัม** ได้ 1 แต้ม มีเศษสะสมและยอดแยกจากกระท่อม
- แต้มคำนวณจากฝั่ง server; ห้ามเชื่อยอดแต้มที่ส่งมาจาก browser
- ฟีเจอร์แต้มกัญชาควบคุมโดยเจ้าของร้านและปิดไว้เป็นค่าเริ่มต้นเมื่อไม่มีการตั้งค่าเป็นเปิด อย่าเปิดหรือสื่อสารว่าเปิดใช้งานแล้วโดยไม่มีการยืนยัน
- การยืนยันแลกรางวัลกับการตัดแต้มต้องไม่คิดซ้ำ; การแก้ไขรายการขายหรือรายการแต้มต้องรักษาประวัติและ audit trail
- เอกสาร `replit.md` บางส่วนยังบอกว่าแต้มกระท่อมได้จากชุดเครื่องดื่มสามขวด นี่เป็นข้อมูลเก่าที่ขัดกับ logic ปัจจุบันใน `loyalty-store.ts` และ `points-policy.ts`

**สิ่งที่ต้องให้เจ้าของยืนยันก่อนเผยแพร่**

- ราคา สูตร ปริมาณสินค้า และสินค้าในสต็อกปัจจุบัน
- เวลาเปิดร้าน พื้นที่จัดส่ง และเงื่อนไขจัดส่ง
- รายละเอียดโปรโมชัน เช่น “สะสม 10 แต้ม รับฟรี 2 ขวด” ซึ่งมีอยู่ในข้อความ/ภาพเดิมบางส่วน แต่อาจไม่ใช่เงื่อนไขปัจจุบัน
- เกณฑ์และสิทธิประโยชน์ของระดับสมาชิก; ห้ามอนุมานจากชื่อหรือภาพ rank icon
- การเปิดใช้แต้มกัญชาและข้อความเกี่ยวกับสินค้าหรือข้อกำกับทางกฎหมาย

ภาพเมนู โปสเตอร์ และ campaign artwork เป็น asset สำหรับอ้างอิงภาพเท่านั้น ไม่ใช่แหล่งยืนยันราคา เวลาเปิดร้าน ส่วนผสม คุณสมบัติ หรือเงื่อนไขการขาย

### 7. แผนที่ asset ของแบรนด์

เว็บอ่านภาพจาก `artifacts/jaguar-house/public/` โดย path ในหน้าเว็บเริ่มด้วย `/brand/` หรือ `/ui/`

#### โลโก้และ wordmark

| ไฟล์ | การใช้งานและข้อควรระวัง |
| --- | --- |
| `public/brand/jaguar-spk-emblem-crisp.webp` | ตราหลักที่คมชัด ใช้ใน `JaguarMark` และหน้า `/brand`; แสดงเต็มภาพ |
| `public/brand/jaguar-spk-emblem.webp` | ตรา JAGUAR SPK อีกเวอร์ชัน ตรวจความคมชัดและการใช้งานก่อนเลือก |
| `public/brand/jaguar-spk-wordmark-final.webp` | wordmark แนวนอนรุ่น final |
| `public/brand/jaguar-spk-wordmark.webp`, `jaguar-spk-wordmark.png` | wordmark อีกไฟล์/รูปแบบ; ตรวจว่าตรงกับงานก่อนใช้ |
| `public/brand/jaguar-logo.webp`, `jaguar-logo-256.jpg` | artwork โลโก้รุ่นเดิมของ Jaguar Kratom House |
| `public/ui/jaguar-spk-emblem.png`, `jaguar-spk-wordmark.png` | ภาพตราและ wordmark สำหรับ UI |
| `public/brand/mark-jaguar.svg`, `mark-leaf.svg` | เครื่องหมายประกอบ UI; ไม่ใช่ logo lockup ทดแทน |

#### ภาพสินค้าและสื่อโปรโมชัน

- ขวด JAGUAR SPK: `public/brand/product-kratom-gold.webp`, `product-kratom-blue.webp`, `product-kratom-red.webp`
- สินค้าที่หน้าเว็บปัจจุบันแสดงเพิ่มเติม: `product-tobacco-tin.webp`, `product-vess-packs.webp`
- ภาพแคมเปญ/หน้าแบรนด์: `jaguar-spk-city-hero.webp`, `jaguar-spk-city-campaign.webp`, `jaguar-spk-campaign-square.jpg`, `jaguar-spk-promo.png`, `jaguar-landing-promo.jpg`
- โปสเตอร์จัดส่ง: `jaguar-delivery-promo.webp`
- เมนู/ราคา: `jaguar-price-board.webp`, `campaign/jaguar-price-board.jpg`
- แคมเปญพื้นที่: `campaign/jaguar-samut-prakan-campaign.jpg`

สื่อกลุ่มนี้อาจมีข้อความ ราคา หรือคำกล่าวอ้างที่เปลี่ยนแปลงได้ ห้ามถอดข้อความจากภาพมาใช้เป็นข้อเท็จจริงปัจจุบันโดยไม่ตรวจยืนยัน

#### สมาชิก บัตร สถานะ และ QR

- คู่มือสมาชิก: `jaguar-member-guide-v3.webp`, `jaguar-member-onboarding-guide.jpg`
- ภาพบัตร/กรอบสมาชิก: `card-kratom-full.jpg`, `card-cannabis-full.jpg`, `kratom-card-plaque.webp`, `cannabis-card-plaque.webp`, `kratom-club-preview.webp`, `cannabis-club-preview.webp`, `jaguar-card-mark.webp`, `samut-prakan-card.webp`
- ภาพสถานะ: `member-status-collecting.webp`, `member-status-ready.webp`
- ไอคอนหมวด: `icon-card-kratom.svg`, `icon-card-cannabis.svg`, `icon-reward.svg`
- QR สำหรับ LINE OA: `line-oa-qr.png`; ตรวจปลายทางก่อนพิมพ์หรือเผยแพร่ซ้ำ
- ภาพ rank อยู่ใน `public/brand/rank-icons/`: `cyber-start`, `organic-premium`, `nature-green`, `inferno-power`, `leopard-vip`, `diamond-member`, `royal-king`, `dragon-emperor`, `cosmic-world`, `ultimate-legend` (ทั้งหมดเป็นไฟล์ `.webp`)

ภาพบัตรหรือสถานะที่เป็น artwork ไม่ใช่ข้อมูลสมาชิกจริง ไม่ควรนำไปแทนยอดแต้ม รหัส QR หรือสถานะสดของสมาชิก

#### ภาพเมนูเจ้าของร้านและไฟล์อ้างอิง

- ไอคอนเมนูเจ้าของอยู่ที่ `public/brand/owner-menu/` ได้แก่ `overview.svg`, `members.svg`, `rewards.svg`, `redemptions.svg`, `security.svg`, `qr-poster.svg`
- ไอคอนชุดนี้มาจาก Microsoft Fluent Emoji ภายใต้ MIT License; หากคัดลอกหรือแจกจ่าย ต้องคง attribution และ license ตาม `ATTRIBUTION.md` กับ `LICENSE.txt`
- `attached_assets/` เป็นแหล่งไฟล์อัปโหลดและภาพอ้างอิงจำนวนมาก ไม่ใช่ทุกไฟล์จะเป็น asset ที่อนุมัติให้ใช้จริง ควรตรวจไฟล์และสิทธิ์ก่อนนำไปเผยแพร่
- Design system เก็บสำเนา/ตัวอย่าง asset สำหรับคู่มือไว้ใน `artifacts/jaguar-spk-design-system/docs/references/` และ `public/brand/`; สำหรับหน้าร้านให้ตรวจ path ที่เว็บใช้ใน `artifacts/jaguar-house/public/`

### 8. แยกข้อเท็จจริง เอกสารเก่า และข้อมูลที่ยังไม่ทราบ

| สถานะ | รายการ |
| --- | --- |
| ยืนยันจากโค้ด/เอกสารปัจจุบัน | ที่ตั้งที่เว็บระบุ; Next.js 15; Express 5; Replit-managed PostgreSQL; การมีหน้า member/staff/owner; login สมาชิก 3 วิธี; แต้มกระท่อมต่อยอดสะสม ฿100; แต้มกัญชาต่อ 100 g และ feature ควบคุมโดยเจ้าของ |
| มีข้อมูลเก่าขัดกับปัจจุบัน | `replit.md` ระบุ member-code-only และแต้มจากชุดขวด; `DESIGN.md` ระบุว่าไม่มี design system package; `supabase/README.md` กล่าวถึงการเชื่อม Supabase เดิม |
| ห้ามสรุปเอง | ชั่วโมงเปิดร้าน, เบอร์โทร, ราคา/สต็อกปัจจุบัน, สูตรหรือประโยชน์สินค้า, โปรโมชันที่ยัง active, พื้นที่จัดส่ง, rank benefits, สถานะการปฏิบัติตามกฎหมาย |

ฐานข้อมูลปัจจุบันที่เอกสารโครงการระบุคือ Replit-managed PostgreSQL ส่วน `supabase/` เป็นบันทึกการเชื่อมต่อ/การย้ายข้อมูลเก่า ไม่ใช่ที่เก็บข้อมูล loyalty ปัจจุบัน ห้ามย้ายข้อมูลจาก Supabase หรือใช้ key เก่าโดยอัตโนมัติ

### 9. Prompt ตั้งต้นสำหรับ AI Agent

คัดลอกข้อความต่อไปนี้ไปใส่ใน system instructions หรือ project instructions ของ agent:

> คุณเป็น AI agent ที่ช่วยพัฒนาและจัดการประสบการณ์ดิจิทัลของร้าน JAGUAR SPK / Jaguar Kratom House ในบุญศิริ ซอย 6 จังหวัดสมุทรปราการ ใช้ฐานความรู้ JAGUAR SPK นี้เป็นบริบทหลัก และตรวจแหล่งอ้างอิงใน repository ก่อนแก้โค้ดหรือยืนยันรายละเอียดธุรกิจ
>
> ยึดตัวตนแบรนด์แบบพรีเมียม สุขุม อ่านง่าย และ mobile-first ใช้ภาพตรา/wordmark ที่ผู้ใช้ให้มาโดยแสดงเต็มภาพ ไม่ครอปหรือสร้างตราใหม่ ใช้ JAGUAR SPK Design System ตามเอกสารและ tokens.json ห้ามแต่งสีหรือระบบออกแบบชุดใหม่
>
> แยกข้อเท็จจริงที่ยืนยันแล้วออกจากข้อมูลเก่าและข้อมูลที่ต้องถามเจ้าของ หากราคา เวลาเปิดร้าน สต็อก โปรโมชัน รายละเอียดสินค้า หรือข้อมูลกฎหมายไม่ชัด ให้ถามก่อน ห้ามอนุมานจากข้อความในโปสเตอร์หรือภาพ campaign
>
> เมื่อทำงานกับระบบสมาชิก ให้รักษาเส้นทาง บทบาท auth, session, แต้ม, ประวัติ และการแลกรางวัลเดิมไว้ การ login สมาชิกปัจจุบันรองรับเบอร์โทร รหัสสมาชิก หรือชื่อเล่นโดยไม่มี OTP; อย่าอธิบายว่าเป็นการยืนยันตัวตนระดับสูง แต้มต้องคำนวณจาก server และห้ามใช้ข้อมูลสมาชิกจริงเป็นตัวอย่าง
>
> ห้ามแสดงหรือบันทึก secret, PIN, password, token, credential, connection string หรือข้อมูลส่วนบุคคลใน source code, Markdown, prompt, log หรือคำตอบ ใช้ระบบจัดการ secrets ของ workspace เท่านั้น ก่อนเปลี่ยนฐานข้อมูล การย้ายข้อมูล กติกาแต้ม การเปิด feature แต้มกัญชา หรือการเปลี่ยน auth ให้ขออนุมัติเจ้าของ
>
> ก่อนสรุปคำตอบ ให้ระบุสิ่งที่ตรวจแล้ว แหล่งข้อมูลที่ใช้ และสมมติฐาน/สิ่งที่ยังต้องให้เจ้าของยืนยัน อย่ากล่าวว่ามีการ deploy หรือทดสอบ production ถ้าไม่ได้ตรวจจริง

## 🏆 Benefits — ประโยชน์

- นำไฟล์ Markdown นี้เข้า NotebookLM ได้โดยตรง และถามตอบจากหัวข้อที่จัดเป็นช่วงสั้น ๆ
- Agent ใหม่เห็นตัวตนแบรนด์ ภาพรวมระบบ และเส้นทางหลักได้โดยไม่ต้องอ่าน repository ทั้งหมดก่อน
- การอ้าง path แหล่งข้อมูลช่วยให้ย้อนตรวจคำตอบและตามหาต้นฉบับได้
- ส่วนสถานะข้อมูลช่วยลดการนำ policy เก่าหรือข้อความจากภาพโปรโมชันไปใช้ผิด
- รายการ asset ช่วยให้เลือกไฟล์ที่ถูกและรักษาโลโก้ ลิขสิทธิ์ และ QR ได้เหมาะสม

## 👀 Examples — ตัวอย่าง

### ✅ Good: ใช้ prompt ที่ระบุแหล่งข้อมูลและถามก่อนเมื่อไม่แน่ใจ

“ช่วยปรับหน้าแนะนำแบรนด์โดยใช้ตรา JAGUAR SPK เดิมและ design system ปัจจุบัน ตรวจข้อมูลร้านจาก source ก่อน ห้ามแต่งราคา/เวลาเปิดร้าน หากจะเปลี่ยน route หรือกติกาสมาชิกให้ถามเจ้าของก่อน”

### ❌ Bad: อนุมานข้อมูลธุรกิจจากภาพ

“โปสเตอร์มีราคาและข้อความ 24 ชั่วโมงอยู่แล้ว ให้ใช้เป็นราคาและเวลาเปิดร้านปัจจุบันทุกหน้า”

### ❌ Bad: ปฏิบัติตามเอกสารเก่าโดยไม่ตรวจโค้ด

“ใช้ member-code-only login และให้แต้มหนึ่งแต้มต่อทุกสามขวด เพราะมีข้อความนี้ใน `replit.md`”

## 🧐 Real world examples — แหล่งตัวอย่างในโปรเจกต์

- `artifacts/jaguar-house/src/components/brand/welcome.tsx` — หน้าแรกและการใช้ภาพ/ช่องทางติดต่อจริง
- `artifacts/jaguar-house/src/app/brand/page.tsx` — หน้าแนะนำแบรนด์และลิงก์ที่ใช้งานจริง
- `artifacts/jaguar-house/src/components/brand/auth-forms.tsx` — วิธี login ที่หน้าเว็บปัจจุบันรองรับ
- `artifacts/api-server/src/routes/loyalty.ts` — สัญญาและบทบาทของ API loyalty
- `artifacts/api-server/src/lib/loyalty-store.ts` — การคำนวณยอดขาย แต้ม และการควบคุม cannabis feature
- `artifacts/api-server/src/lib/points-policy.ts` — การคำนวณแต้มและเศษสะสมต่อหน่วย
- `artifacts/jaguar-spk-design-system/tokens.json` — ค่าต้นทางของโทเคนสี ฟอนต์ ระยะ และมุม
- `artifacts/jaguar-house/public/brand/` — ไฟล์ภาพที่เว็บใช้งาน
- `artifacts/jaguar-house/public/brand/owner-menu/ATTRIBUTION.md` และ `LICENSE.txt` — ที่มาและ license ของภาพประกอบเมนู

## 🔗 Related agreements — เอกสารที่เกี่ยวข้อง

- [ดัชนีเอกสารโปรเจกต์](../../AGENTS.md)
- [คำแนะนำการรันและข้อมูลระบบปัจจุบัน](../../replit.md)
- [แนวทางออกแบบ UI/UX และภาพ loyalty](../frontend/jaguar-loyalty-design-guidelines.md)
- [JAGUAR SPK Design System — คำแนะนำสำหรับเว็บ](../../artifacts/jaguar-spk-design-system/docs/consuming-web.md)
- [JAGUAR SPK Design System — ข้อกำหนดการใช้แบรนด์และโทเคน](../../artifacts/jaguar-spk-design-system/docs/AGENTS.md)
- [หมายเหตุ Supabase เดิม](../../supabase/README.md) — เอกสารประวัติ/การเชื่อมต่อเก่า ไม่ใช่แหล่งข้อมูล loyalty ปัจจุบัน

เอกสารนี้สร้างโดย 🐢 💨 (Turbotuga™, มาสคอตของ [Codely](https://codely.com))
