# Hệ Thống SOS Nội Bộ Doanh Nghiệp (FastAPI Backend)

Hệ thống quản lý sự cố và tiếp nhận cuộc gọi/tin nhắn SOS khẩn cấp nội bộ dành cho doanh nghiệp có quy mô:
- **50 - 200 xe buýt** đưa đón công nhân viên
- **10 - 30 tòa nhà Ký túc xá (KTX)**
- Triển khai Cloud Ready (AWS ECS/EKS, GCP Cloud Run, Azure Container Apps hoặc VPS Docker).

---

## 🚀 Điểm Nhấn Kiến Trúc & Công Nghệ

1. **Backend Framework**: FastAPI (Async/Await 100%), Python 3.11+.
2. **Database & ORM**: PostgreSQL 16 + SQLAlchemy 2.0 (chuẩn AsyncSession, typing `Mapped`, `mapped_column`) + AsyncPG driver.
3. **Database Migrations**: Alembic cấu hình Async migrations (`asyncpg`).
4. **Validation & Typing**: Pydantic v2 & `pydantic-settings`.
5. **Tích hợp Zalo ZNS (Zalo Notification Service)**:
   - Thay thế việc bắt công nhân cài đặt Flutter app bằng Web PWA quét mã QR tem dán trên xe buýt / cửa phòng KTX.
   - Gửi ZNS tức thời đến số điện thoại Quản lý xe/KTX khi có ticket mới.
   - Khi ticket chuyển sang `RESOLVED`, tự động gửi tin nhắn ZNS kèm link khảo sát CSAT đến Zalo công nhân.
   - Hỗ trợ chế độ **Mock Mode** (`ZALO_ZNS_MOCK_MODE=true`) cho môi trường dev/staging và chế độ gọi trực tiếp Zalo OpenAPI cho production.
6. **Cơ Chế Gọi Dự Phòng Fallback (Hotline Direct Dial)**:
   - API `POST /api/v1/calls/intent` ghi nhận nhật ký khi WebRTC kết nối thoại thất bại hoặc công nhân chủ động bấm gọi hotline khẩn cấp qua mạng viễn thông.
7. **Cơ Chế Tự Động Escalation**:
   - Khi công nhân đánh giá CSAT `UNSATISFIED` (Chưa hài lòng): Ticket tự động chuyển trạng thái `REOPENED`, đồng thời kích hoạt gửi cảnh báo ZNS khẩn cấp tới Quản lý trực tiếp và Ban Giám Đốc / Vận Hành.
8. **Quy Tắc Sinh Mã Ticket**: Mã định dạng chuẩn `#TK-YYMM-XXXX` (ví dụ: `#TK-2610-0089`).
9. **Báo Cáo Phân Tích Vận Hành (BI Reports)**:
   - Tổng quan tiếp nhận, xử lý, tỉ lệ hài lòng CSAT, thời gian xử lý trung bình và tỉ lệ tuân thủ SLA.
   - Phân bố sự cố theo 24 khung giờ (`/reports/by-hour`) tối ưu hóa ca trực.
   - Điểm nóng sự cố (`/reports/hotspots`) xác định xe hỏng nhiều hoặc KTX cần bảo trì.
   - Bảng xếp hạng vận hành (`/reports/leaderboard`) đánh giá hiệu quả giải quyết của từng Quản lý.
10. **Bộ Sinh Mã QR Code Động**:
    - Tự động sinh file ảnh QR code chất lượng cao kèm tiêu đề "SOS KHẨN CẤP" và nhãn mã xe/phòng KTX sẵn sàng in tem decal.

---

## 📁 Cấu Trúc Thư Mục

```
d:\app SOS\backend\
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point, CORS, lifespan, routes
│   ├── config.py            # Settings (Pydantic Settings v2)
│   ├── database.py          # SQLAlchemy 2.0 async engine & sessionmaker
│   ├── seed.py              # Script nạp 50 xe buýt, 20 KTX, quản lý & demo tickets
│   ├── models/              # SQLAlchemy Database Models
│   │   ├── __init__.py
│   │   ├── user.py          # Bảng users (staff, manager, dispatcher, admin)
│   │   ├── location.py      # Bảng locations (BUS, DORM, QR mapping, manager)
│   │   ├── ticket.py        # Bảng tickets (ID #TK-YYMM-XXXX, CSAT, status)
│   │   └── call_intent.py   # Bảng call_intents (Log gọi thoại dự phòng)
│   ├── schemas/             # Pydantic v2 DTO Schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── location.py
│   │   ├── ticket.py
│   │   ├── call_intent.py
│   │   └── report.py
│   ├── routers/             # FastAPI API Endpoints
│   │   ├── __init__.py
│   │   ├── locations.py     # GET/POST/PATCH /locations (quét QR, lấy thông tin)
│   │   ├── tickets.py       # POST/GET/PATCH /tickets, đánh giá CSAT
│   │   ├── calls.py         # POST /calls/intent (fallback hotline)
│   │   └── reports.py       # GET /reports (overview, by-hour, hotspots, leaderboard)
│   ├── services/            # Business Logic Services
│   │   ├── __init__.py
│   │   ├── zalo_zns.py      # Gửi ZNS qua Zalo OpenAPI (hoặc Mock logger)
│   │   ├── notification.py  # Điều phối thông báo đa kênh
│   │   └── escalation.py    # Kích hoạt escalation khi CSAT Không hài lòng
│   └── utils/
│       ├── __init__.py
│       ├── ticket_id.py     # Hàm sinh mã ticket #TK-YYMM-XXXX
│       └── qr_generator.py  # Sinh ảnh QR code có khung in ấn cho xe & KTX
├── alembic/                 # Database Migrations
│   ├── env.py               # Async Alembic runner
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_sos_schema.py
├── alembic.ini              # Cấu hình Alembic
├── requirements.txt         # Thư viện dependencies
├── .env.example             # Mẫu biến môi trường
├── Dockerfile               # Container build production-ready
└── docker-compose.yml       # Docker Compose gồm FastAPI, Postgres 16, Redis 7
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Chạy Bằng Docker Compose (Khuyên dùng)

1. Sao chép cấu hình môi trường:
   ```bash
   cp .env.example .env
   ```
2. Khởi động toàn bộ stack (FastAPI App, PostgreSQL, Redis):
   ```bash
   docker compose up -d --build
   ```
3. Xem logs:
   ```bash
   docker compose logs -f app
   ```

### Cách 2: Chạy Local Cho Development

1. Tạo môi trường ảo Python 3.11+:
   ```bash
   python -m venv venv
   # Trên Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
2. Cài đặt các thư viện:
   ```bash
   pip install -r requirements.txt
   ```
3. Khởi tạo database (Chạy PostgreSQL cục bộ trên cổng 5432):
   ```bash
   alembic upgrade head
   ```
4. Nạp dữ liệu mẫu 50 xe buýt, 20 KTX và các tài khoản quản lý:
   ```bash
   python -m app.seed
   ```
5. Khởi động backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 📡 Danh Sách API Endpoints Chính

| Phương Thức | Đường Dẫn Endpoint | Mô Tả Chức Năng |
| :--- | :--- | :--- |
| **GET** | `/api/v1/locations/{id}` | Trả về thông tin xe/KTX theo UUID khi công nhân quét mã QR |
| **GET** | `/api/v1/locations/{id}/qr` | Trả về trực tiếp ảnh PNG mã QR có khung in ấn |
| **GET** | `/api/v1/locations` | Danh sách các tuyến xe buýt và phòng KTX |
| **POST** | `/api/v1/locations` | Đăng ký xe hoặc phòng KTX mới |
| **POST** | `/api/v1/calls/intent` | Ghi log cuộc gọi dự phòng và nhận số Hotline khẩn cấp |
| **POST** | `/api/v1/tickets` | Tiếp nhận ticket sự cố mới (tự sinh mã `#TK-YYMM-XXXX` & gửi ZNS) |
| **GET** | `/api/v1/tickets/{ticket_id}` | Xem chi tiết tiến độ xử lý ticket sự cố |
| **GET** | `/api/v1/tickets` | Danh sách lọc tickets (theo trạng thái, mức độ khẩn cấp, vị trí) |
| **PATCH** | `/api/v1/tickets/{ticket_id}/status` | Cập nhật trạng thái ticket (`RESOLVED` tự gửi link CSAT qua ZNS) |
| **POST** | `/api/v1/tickets/{ticket_id}/csat` | Đánh giá độ hài lòng (`UNSATISFIED` tự động reopen và kích hoạt Escalation) |
| **GET** | `/api/v1/reports/overview` | Báo cáo BI tổng quan: Tỉ lệ xử lý, SLA, độ hài lòng CSAT |
| **GET** | `/api/v1/reports/by-hour` | Phân bố lượng cuộc gọi/ticket theo 24 khung giờ trong ngày |
| **GET** | `/api/v1/reports/hotspots` | Danh sách Top các xe buýt / KTX có tần suất sự cố cao nhất |
| **GET** | `/api/v1/reports/leaderboard` | Bảng xếp hạng hiệu suất xử lý và điểm CSAT của đội ngũ Quản lý |

Tài liệu Swagger UI tương tác trực tiếp có tại: `http://localhost:8000/docs`.

---

## 🖨️ Sinh Mã QR Hàng Loạt Cho Tem Dán Xe Buýt & KTX

Chạy lệnh CLI sau để xuất toàn bộ file ảnh QR code (PNG độ phân giải cao) cho toàn bộ địa điểm có trong database vào thư mục `generated_qrcodes/`:

```bash
python -m app.utils.qr_generator
```
Các file ảnh sẽ được gắn nhãn đầy đủ tên xe, biển số hoặc số phòng KTX để in ấn và dán decal.
