# WebsitePublisher Backup — JAGUAR SPK กระท่อม ใกล้ฉัน (`project28987`)

สำรองโค้ดหน้าเว็บและไฟล์ภาพจาก `https://project28987.websitepublisher.ai` (WebsitePublisher `project_id: 28987`, `index.html` version 21 / `298add29`) ณ วันที่ **25 พฤศจิกายน 2026**

## รายการไฟล์ที่สำรอง

| ไฟล์ | ขนาด (bytes) | SHA-256 | หมายเหตุ |
| --- | ---: | --- | --- |
| `index.html` | 61,301 | `b22c50a33acdbe393d831ffe1e6515240d9d20dfcd3fa2544b7abbdc60325eac` | หน้าสั่งซื้อมุมมองเดียว (`home` → `cart` → `checkout` → `#track`), ยิง `POST` เข้า Supabase `dt_orders` ก่อน แล้ว fallback ไป SAPI `contact` |
| `thank-you.html` | 5,817 | `20364c98122c29e7356ae4b93d0b6945b34582eee1a7ff04d2607f3fcc7884d9` | หน้าขอบคุณหลังสั่งซื้อ (`noindex, nofollow`) |
| `privacy.html` | 6,946 | `24fbe79c861c5729fa56a675adec33d6fba6fad1e6fec70f6b6589406bfec0fe` | นโยบายความเป็นส่วนตัว + เงื่อนไข 18+ (`noindex, nofollow`) |
| `monitor.html` | 14,737 | `cbdd412334b533e6ea388ae101f2558d85f31ef1d89bf1e0630b66072d3ef031` | แผง OPS สำหรับแก้ร่าง `PRODUCTS` JSON (`noindex, nofollow`) |
| `images/logo.png` | — | `e9cbe2b9a4a65d8a1d9d7cb270b3ec76671ca9ae8ff6fbb22f0ac50f411cb25f` | โลโก้ร้านบน CDN `wid28987` |
| `images/drink-red.jpg` | — | `64040f9c19fd67440213efae6897173cb6038b663b2793164225ec41d7850e60` | Kratom Drink ฝาแดง สายหวาน (`id: drink`) |
| `images/drink-blue.jpg` | — | `91f60cdf373e18a15f1619b38f18f81b48a6a7a136b5b39651fe0a8542c4eb35` | Kratom Drink ฝาน้ำเงิน สายชิล (`id: drink-blue`) |
| `images/drink-gold.jpg` | — | `79c9d2e9efd517eec53fae1157885020b05707ab449e8ead00e482461d79eca2` | Kratom Drink ฝาทอง สายเข้ม (`id: drink-gold`) |
| `images/promo-drink.png` | — | `813b68118e8f070cbe097322f3aba1caa1f3ea5adc8aa3af61d356fe2e2f87ca` | แบนเนอร์โปรโมชั่นน้ำกระท่อม |
| `images/promo-weed.png` | — | `fe7330ddaa0c7f61f6c848308988187be0261a756c39b63a338c36002e458e74` | กัญชาคุณภาพดีเงิน (`id: weed`) |

## ความปลอดภัยของไฟล์สำรอง

- ไม่มี `service_role` key, PIN หรือข้อมูลส่วนบุคคลของลูกค้าอยู่ในไฟล์ชุดนี้
- มีเฉพาะ Supabase publishable/anon key (`sb_publishable_...`) สำหรับฝั่งเบราว์เซอร์ตามการออกแบบของระบบ
