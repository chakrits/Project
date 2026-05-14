# Project Specification: Local API Mocking Dashboard (Prism-Inspired)

## 1. Objective
สร้างระบบ Mock API Server ที่รันบน Local โดยใช้ไฟล์ JSON เป็นที่เก็บข้อมูล (No Database) รองรับการทำ Dynamic Examples และ Wildcard Paths เพื่อใช้ในการทดสอบระดับมืออาชีพ

## 2. Technical Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React (Vite), Tailwind CSS, Lucide React (Icons)
- **Data:** Local JSON storage (`db/endpoints.json`, `db/logs.json`)
- **Testing:** Jest & Supertest

## 3. Core Logic (The "Brain")

### A. Wildcard & Dynamic Path Matching
- ระบบต้องรองรับ Path แบบ Dynamic (เช่น `/users/:id` หรือ `/orders/:orderId/items`)
- ใช้ Library `path-to-regexp` หรือ Logic ของ Express เพื่อจับคู่ Request Path เข้ากับ Pattern ที่บันทึกไว้ใน `endpoints.json`

### B. Prism-Style Response Selection
เมื่อได้รับ Request ให้เลือก Response ตามลำดับความสำคัญ (Priority):
1. **Query Param:** เช็ค `?__code=404` หรือ `?__example=not_found`
2. **Header:** เช็ค `Prefer: code=404` หรือ `Prefer: example=not_found`
3. **Default:** หากไม่ระบุ ให้ใช้ Response ที่ทำเครื่องหมาย `isDefault: true`

### C. Logging System (Full Snapshot)
บันทึกทุก Transaction ลง `db/logs.json` โดยเก็บข้อมูล:
- **Request:** Method, Full URL, Headers, Query, Body
- **Response:** Status Code, Response Body (Actual), Latency (ms)
- **Trace:** Generate `traceId` สำหรับแต่ละ Request เพื่อใช้ Investigate

## 4. Frontend Requirements (Dashboard)

### A. Endpoint Manager
- Sidebar แสดงรายการ Endpoint แยกตามสีของ HTTP Methods
- ส่วนแก้ไขข้อมูลรองรับการเพิ่ม "Multiple Examples" ใน 1 Endpoint
- มี JSON Editor สำหรับแต่ง Response Body

### B. Advanced Traffic Inspector
- แสดงตาราง Logs ล่าสุด
- เมื่อคลิก Log ต้องแสดงผลเปรียบเทียบ "Request vs Response" แบบ Side-by-Side (คล้าย Network Tab ใน Chrome)
- มีปุ่ม "Copy as cURL" และ "Clear Logs"

## 5. Data Schema Examples

### `endpoints.json`
```json
[
  {
    "id": "e1",
    "method": "GET",
    "path": "/api/users/:id",
    "responses": [
      { "label": "Success", "status": 200, "body": { "id": ":id", "name": "John Doe" }, "isDefault": true },
      { "label": "Not Found", "status": 404, "body": { "error": "User not found" } }
    ]
  }
]