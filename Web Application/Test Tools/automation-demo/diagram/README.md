# Architecture Diagram — Two Automation Demos

Diagram สรุปว่า Mock Server ตัวเดียวจ่าย demo endpoints ให้ทั้งสองเลน:
**Newman (API)** และ **Playwright (UI ผ่าน Mini Postman)** โดยแต่ละเลนออก report ของตัวเอง

## ไฟล์

| ไฟล์ | ใช้ทำอะไร |
|------|-----------|
| `two-demos-architecture.svg` | ต้นฉบับ (แก้ที่นี่ — เป็น vector แก้ข้อความ/สีได้) |
| `two-demos-architecture.png` | ภาพสำหรับแปะสไลด์ (1360×1130, 2×) |
| `svg-to-png.js` | สคริปต์แปลง SVG → PNG ด้วย Chromium ของ Playwright |

## 1. วิธีเอาไปใช้ในสไลด์ (ใช้ทันที)

ไฟล์ `two-demos-architecture.png` พร้อมใช้เลย — ลากเข้า PowerPoint / Keynote / Google Slides ได้ทันที
- ความละเอียด 2× (1360×1130) คมชัดเมื่อฉายโปรเจกเตอร์
- พื้นหลังขาว เข้ากับสไลด์ธีมสว่าง

## 2. วิธี regenerate PNG (เมื่อแก้ไข diagram)

```bash
# แก้ข้อความ/สีในไฟล์ .svg ก่อน แล้วสั่ง:
npm run diagram:png
```

หรือเรียกสคริปต์ตรง ๆ พร้อมกำหนด input/output/scale เอง:

```bash
# node svg-to-png.js [input.svg] [output.png] [scale]
node automation-demo/diagram/svg-to-png.js \
  automation-demo/diagram/two-demos-architecture.svg \
  automation-demo/diagram/two-demos-architecture.png \
  3      # 3x = 2040×1695 (ภาพใหญ่พิเศษสำหรับโปสเตอร์)
```

> สคริปต์ใช้ Chromium ที่ติดมากับ Playwright อยู่แล้ว — ไม่ต้องลง ImageMagick / Inkscape เพิ่ม

## 3. วิธีแก้เนื้อหา diagram

เปิด `two-demos-architecture.svg` ด้วย editor:
- **แก้ข้อความ** — แก้ใน `<text>` ของแต่ละกล่อง (เช่น เปลี่ยน "19 assertions")
- **แก้สี** — แต่ละกล่องมี `fill` (พื้น) + `stroke` (ขอบ) + `fill` ของ `<text>`
  - 🔵 น้ำเงิน (เลน API): `#E6F1FB` / `#185FA5`
  - 🟣 ม่วง (เลน UI): `#EEEDFE` / `#534AB7`
  - 🟢 เขียว (Mock ที่ใช้ร่วม): `#E1F5EE` / `#0F6E56`
  - ⚪ เทา (report): `#F1EFE8` / `#5F5E5A`

แก้เสร็จสั่ง `npm run diagram:png` แล้วได้ PNG อัปเดต

## 4. ต้องการ format อื่น

- **PDF (vector คมทุกขนาด)** — เปิด `.svg` ใน browser → Print → Save as PDF
- **คัดลอกใส่ Figma/Illustrator** — import ไฟล์ `.svg` ได้ตรง ๆ (ยังแก้เป็น vector ได้)
