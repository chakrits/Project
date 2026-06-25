# New Requirement

## REFERENCE

อ้างอิงจาก Claim Form A Patient (auto-login.html)

อยากให้ช่วยเพิ่ม auto-login-fast-track เข้าไปอีก 1 ฟอร์ม โดยให้ใช้ชื่อเมนูว่า Fast Track

และอยากให้เพิ่มอีก form คือ Medical Expense OPD , Medical Expense IPD

paramter ที่ใช้สำหรับ encryption มีดังนี้

### Fast Track

```json
{
  "bu_code": "005",
  "sc": "/digitsign/gen_fast_track",
  "action": "gen_fast_track",
  "template_code": "claim_fast_track",
  "hn": "05-24-021573",
  "en": "I05-24-008948",
  "patient_row_id": "682313",
  "encounter_row_id": "1940528",
  "clinic_location": "",
  "appointmant_id": "appointment001",
  "visit_datetime": "2025-06-04T08:00:00",
  "discharge_datetime": "2025-07-11T14:00:00",
  "payor_office_code": "9000714002",
  "total_hospital_expenses": "888,888.88",
  "request_id": "436",
  "download_password": "15112000",
  "open_file_password": "15112000",
  "requested_user": "Chakrit.Sa",
  "requested_datetime": "2025-06-29T23:22:16",
  "created": "2025-06-29T23:22:16"
}
```

### Medical Expense OPD

```json
{
  "bu_code": "005",
  "sc": "/digitsign/gen_opd_medical_expenses",
  "action": "gen_opd_medical_expenses",
  "template_code": "claim_expense_opd",
  "hn": "05-24-021566",
  "en": "O05-24-142999",
  "patient_row_id": "1624101714111252801",
  "encounter_row_id": "1624101715001649601",
  "clinic_location": "",
  "appointmant_id": "appointment001",
  "download_password": "15112000",
  "open_file_password": "15112000",
  "visit_datetime": "2024-10-17T15:00:16",
  "discharge_datetime": "2026-02-24T09:15:43",
  "payor_office_code": "9001449006",
  "invoice_no": "05-CO24057014",
  "invoice_amount": "1599.00",
  "total_hospital_expenses": "1999.0",
  "request_id": "1626022409154324301",
  "requested_user": "Chakrit.Sa",
  "requested_datetime": "2025-06-29T23:22:16",
  "created": "2025-06-29T23:22:16"
}
```

### Medical Expense IPD

```json
{
  "bu_code": "005",
  "sc": "/digitsign/gen_ipd_medical_expenses",
  "action": "gen_ipd_medical_expenses",
  "template_code": "claim_expense_ipd",
  "hn": "05-24-021428",
  "en": "I05-24-008823",
  "patient_row_id": "682313",
  "encounter_row_id": "1940528",
  "clinic_location": "",
  "appointmant_id": "appointment001",
  "visit_datetime": "2025-06-29T08:00:00",
  "discharge_datetime": "2025-07-11T14:00:00",
  "payor_office_code": "9001577002",
  "invoice_no": "05-CI24009526",
  "invoice_amount": "1,500.00",
  "total_hospital_expenses": "15,290.00",
  "request_id": "436",
  "download_password": "15112000",
  "open_file_password": "15112000",
  "requested_user": "Chakrit.Sa",
  "requested_datetime": "2025-06-29T23:22:16",
  "created": "2025-06-29T23:22:16"
}
```

## Style

อ้างอิงตาม Claim Form A Petient ไปก่อน อยากให้ปรับชื่อไฟล์ใหม่ให้สอดคล้องกับการใช้งานของหน้านั้น
เช่น
Claim Form A Patient (claim-form-a-patient.html)
Fast Track (fast-track.html)
อนุญาตให้เสนอ solution เพิ่มได้ เนื่องจากกังวลเรื่องการเชื่อมโยงเรียกใช้งานไปหน้า page ให้ถูกต้อง

## Test and Verification

ตรวจสอบข้อมูลการ encryption ว่าถูกต้องหรือไหม ได้ output ulr ตาม pattern ได้หรือไม่ การ toggle on/off แต่ละ parameter ได้ถูกต้อง ปุ่มแต่ละปุ่มทำงานได้ตาม Function

## Next Phase

หลังจาก implement 4 form นี้เสร็จแล้ว อยากปรับให้รองรับการดึงข้อมูลเบื่องต้นได้จาก Configuration (ulr-generator.html)
