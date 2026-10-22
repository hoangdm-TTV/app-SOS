# Hệ Thống SOS Khẩn Cấp Nội Bộ (Zero-Install PWA)

Ứng dụng PWA (Progressive Web App) tối ưu cho công nhân và tổng đài viên nội bộ:
- **Công nhân:** Quét mã QR tại vị trí (xe đưa đón, phân xưởng, văn phòng) để kích hoạt cuộc gọi khẩn cấp 1 chạm qua WebRTC và gửi tin báo hiện trường (ảnh chụp trực tiếp từ Camera, không lấy từ thư viện).
- **Tổng đài viên:** Tiếp nhận cuộc gọi trên Call Center Portal với tính năng **Screen Pop** định vị tức thì, xem hồ sơ cán bộ phụ trách, tra cứu lịch sử sự cố và tạo phiếu điều phối (Quick Ticket).
- **Đánh giá CSAT:** Khảo sát độ hài lòng của công nhân sau khi sự cố được khắc phục.

---

## 🚀 Cấu Trúc Thư Mục

```
d:\app SOS\frontend\
├── app/
│   ├── layout.tsx                     # Root layout (PWA metadata, manifest, PwaRegister)
│   ├── page.tsx                       # Màn hình chính / Điều hướng nhanh test QR
│   ├── globals.css                    # Tailwind CSS, High Contrast & Animation
│   ├── r/
│   │   └── [id]/
│   │       └── page.tsx               # ⭐ TRANG CHÍNH: Màn hình SOS khi quét mã QR
│   ├── portal/
│   │   └── page.tsx                   # Call Center Portal (Tổng đài viên 2 cột)
│   ├── csat/
│   │   └── [ticket_id]/
│   │       └── page.tsx               # Trang khảo sát CSAT sau xử lý
│   └── api/
│       └── v1/                        # Mock API routes (locations, calls, tickets, csat)
├── components/
│   ├── sos/
│   │   ├── LocationHeader.tsx         # Header đỏ/cam + thông tin xe/phòng & lái xe
│   │   ├── CallButton.tsx             # Nút GỌI TỔNG ĐÀI SOS (WebRTC + Fallback PSTN tel: 3s)
│   │   ├── ReportForm.tsx             # Form gửi tin sự cố (dropdown + textarea + camera)
│   │   └── CameraCapture.tsx          # Chụp ảnh trực tiếp từ camera (không gallery)
│   ├── portal/
│   │   ├── CallPopup.tsx              # Screen Pop khi có cuộc gọi khẩn cấp đến
│   │   ├── TicketForm.tsx             # Quick Ticket form điều phối
│   │   └── CallHistory.tsx            # Danh sách cuộc gọi & hàng đợi
│   ├── csat/
│   │   └── CsatSurvey.tsx             # Khảo sát 2 nút lớn + 3 checkbox khi chưa hài lòng
│   └── PwaRegister.tsx                # Client Service Worker registration
├── lib/
│   ├── api.ts                         # Fetch client wrapper + fallback an toàn
│   ├── webrtc.ts                      # WebRTC voice call + Fallback 3s + Stringee SDK
│   └── types.ts                       # TypeScript interfaces
├── public/
│   ├── manifest.json                  # PWA Manifest chuẩn
│   ├── sw.js                          # Service Worker cache tĩnh & offline
│   └── icons/
│       └── icon.svg                   # Icon SOS vector độ nét cao
├── next.config.js                     # Cấu hình Next.js 14 + PWA
├── tailwind.config.js                 # Theme SOS (Đỏ #DC2626, Xanh #16A34A)
├── package.json
└── .env.example
```

---

## 🛠 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Thiết lập biến môi trường
Tạo file `.env.local` từ `.env.example`:
```bash
cp .env.example .env.local
```
Các cấu hình:
- `NEXT_PUBLIC_API_URL`: Đường dẫn API backend (để trống nếu muốn dùng built-in Next.js route handlers)
- `NEXT_PUBLIC_HOTLINE`: Số hotline dự phòng chuyển tiếp (Mặc định: `19001234`)
- `NEXT_PUBLIC_STRINGEE_APP_ID`: Stringee App ID khi tích hợp thoại IP qua Stringee

### 3. Chạy môi trường phát triển
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 📱 Màn Hình & Tính Năng Chi Tiết

### 1. Màn hình SOS khi quét mã QR (`/r/[id]`)
- **Zero-Install:** Chạy trực tiếp trên trình duyệt di động (Safari iOS, Chrome Android) mà không cần cài ứng dụng từ kho.
- **Tải thông tin tức thì:** Tự động gọi `GET /api/v1/locations/{id}` để nhận dạng biển số xe, tuyến xe hoặc phân xưởng.
- **Nút gọi SOS 1 chạm:**
  - Xin cấp quyền micro và khởi tạo kết nối âm thanh WebRTC với tổng đài.
  - Tự động kích hoạt cơ chế chuyển tiếp sang cuộc gọi viễn thông chuẩn (`tel:19001234`) và gửi `POST /api/v1/calls/intent` nếu sau **3 giây** không kết nối được hoặc bị từ chối quyền microphone.
- **Gửi tin báo hiện trường:**
  - Lựa chọn nhóm vấn đề khẩn cấp.
  - Chụp ảnh trực tiếp từ camera sau (`capture="environment"`), ngăn chặn chọn ảnh cũ từ bộ sưu tập để đảm bảo tính xác thực tại hiện trường.
  - Phản hồi mã phiếu (Ticket ID) ngay sau khi gửi thành công.

### 2. Call Center Portal (`/portal`)
- **Layout 2 cột:** Cột trái hiển thị danh sách cuộc gọi đang chờ / lịch sử; cột phải hiển thị Screen Pop chi tiết và Quick Ticket form.
- **Screen Pop:** Tự động mở popup cảnh báo âm thanh và thị giác khi có cuộc gọi khẩn cấp đang đổ chuông (`ringing`), hiển thị tên xe, cán bộ phụ trách và lịch sử phản ánh gần nhất.
- **Quick Ticket:** Lập nhanh phiếu phản ánh theo nhóm lỗi (*Cơ sở vật chất, Thái độ phục vụ, Chậm tuyến, An ninh, Khác*), chọn mức độ ưu tiên (*Cao - Đỏ / Thấp - Xanh*) và điều phối trực tiếp tới các đơn vị phụ trách.

### 3. Khảo sát CSAT (`/csat/[ticket_id]`)
- Hiển thị kết quả xử lý và tóm tắt sự cố đã giải quyết.
- 2 nút chọn lớn: **[😊 Rất hài lòng]** và **[😞 Chưa hài lòng]**.
- Nếu chọn "Chưa hài lòng", hệ thống tự động mở 3 tiêu chí đánh giá:
  1. *Chưa giải quyết triệt để*
  2. *Thái độ kém*
  3. *Quá chậm trễ*
- Gửi đánh giá tức thời về `POST /api/v1/tickets/{id}/csat`.
