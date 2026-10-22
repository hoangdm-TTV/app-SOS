import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models.location import Location, LocationStatus, LocationType
from app.models.ticket import CSATRating, Ticket, TicketCategory, TicketSeverity, TicketStatus
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sos.seed")


async def seed_data() -> None:
    """Seeds managers, 50 buses, 20 dormitories, and initial sample tickets for demo & testing."""
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed Operations Staff & Line Managers
        manager_names = [
            ("Nguyễn Văn Hùng", "0981234567", "hung.nv@company.internal", UserRole.MANAGER),
            ("Trần Thị Mai", "0982345678", "mai.tt@company.internal", UserRole.MANAGER),
            ("Lê Hoàng Long", "0983456789", "long.lh@company.internal", UserRole.MANAGER),
            ("Phạm Minh Tuấn", "0984567890", "tuan.pm@company.internal", UserRole.DISPATCHER),
            ("Đỗ Hải Yến", "0985678901", "yen.dh@company.internal", UserRole.ADMIN),
        ]

        managers = []
        for name, phone, email, role in manager_names:
            stmt = select(User).where(User.phone_number == phone)
            existing = await session.scalar(stmt)
            if not existing:
                u = User(
                    full_name=name,
                    phone_number=phone,
                    email=email,
                    role=role,
                    is_active=True,
                )
                session.add(u)
                managers.append(u)
            else:
                managers.append(existing)

        await session.flush()
        logger.info(f"Managers ready: {len(managers)} accounts.")

        mgr_buses = [managers[0], managers[1]]
        mgr_dorms = [managers[1], managers[2]]

        # 2. Seed 50 Shuttle Buses
        bus_routes = [
            "Hà Nội - KCN Yên Phong",
            "Hải Dương - KCN Quế Võ",
            "Bắc Giang - Nhà máy số 1",
            "Thái Nguyên - KCN Điềm Thụy",
            "Vĩnh Phúc - KCN Bá Thiện",
        ]

        locations_buses = []
        for i in range(1, 51):
            bus_code = f"BUS-{i:03d}"
            route = bus_routes[i % len(bus_routes)]
            license_plate = f"29B-{10000 + i}"
            assigned_mgr = mgr_buses[i % len(mgr_buses)]

            loc_stmt = select(Location).where(Location.code == bus_code)
            exist_loc = await session.scalar(loc_stmt)
            if not exist_loc:
                loc = Location(
                    id=uuid.uuid4(),
                    type=LocationType.BUS,
                    code=bus_code,
                    name_display=f"Xe buýt tuyến {route} ({license_plate})",
                    manager_id=assigned_mgr.id,
                    status=LocationStatus.ACTIVE,
                    metadata_info={
                        "license_plate": license_plate,
                        "route_name": route,
                        "capacity": 45,
                        "driver_name": f"Tài xế {i}",
                        "driver_phone": f"091100{i:04d}",
                    },
                )
                session.add(loc)
                locations_buses.append(loc)
            else:
                locations_buses.append(exist_loc)

        # 3. Seed 20 Dormitory Buildings & Rooms
        buildings = ["Tòa A (Nam)", "Tòa B (Nữ)", "Tòa C (Chuyên gia)", "Tòa D (Kỹ thuật)"]
        locations_dorms = []
        for i in range(1, 21):
            b_idx = (i - 1) // 5
            b_name = buildings[b_idx % len(buildings)]
            room_no = 100 + (i * 2)
            dorm_code = f"DORM-{b_name[4]}-{room_no}"
            assigned_mgr = mgr_dorms[i % len(mgr_dorms)]

            loc_stmt = select(Location).where(Location.code == dorm_code)
            exist_dorm = await session.scalar(loc_stmt)
            if not exist_dorm:
                loc = Location(
                    id=uuid.uuid4(),
                    type=LocationType.DORM,
                    code=dorm_code,
                    name_display=f"KTX {b_name} - Phòng {room_no}",
                    manager_id=assigned_mgr.id,
                    status=LocationStatus.ACTIVE,
                    metadata_info={
                        "building": b_name,
                        "floor": room_no // 100,
                        "room": str(room_no),
                        "max_occupancy": 8,
                    },
                )
                session.add(loc)
                locations_dorms.append(loc)
            else:
                locations_dorms.append(exist_dorm)

        await session.flush()
        logger.info(f"Locations seeded: {len(locations_buses)} Buses, {len(locations_dorms)} Dorm rooms.")

        all_locations = locations_buses + locations_dorms

        # 4. Seed Realistic Sample Tickets across different hours and states
        now = datetime.now(timezone.utc)
        yymm = now.strftime("%y%m")

        ticket_samples = [
            ("Máy lạnh xe buýt bị hỏng, khoang xe rất ngột ngạt", TicketCategory.TECHNICAL, TicketSeverity.MEDIUM),
            ("Công nhân xỉu nghi sốc nhiệt cần sơ cứu y tế gấp", TicketCategory.MEDICAL, TicketSeverity.CRITICAL),
            ("Phát hiện mùi khét và khói ở tủ điện tầng 2", TicketCategory.FIRE_SAFETY, TicketSeverity.HIGH),
            ("Có xô xát to tiếng giữa hai nhóm công nhân", TicketCategory.CONFLICT, TicketSeverity.HIGH),
            ("Nước sinh hoạt KTX bị mất từ sáng", TicketCategory.TECHNICAL, TicketSeverity.LOW),
            ("Xe bị xẹp lốp trên cao tốc, cần xe cứu hộ điều chuyển", TicketCategory.TECHNICAL, TicketSeverity.HIGH),
            ("Nhặt được ví tiền và thẻ ngân hàng công nhân đánh rơi", TicketCategory.SECURITY, TicketSeverity.LOW),
            ("Cửa kính sau xe bị nứt nguy hiểm khi xe chạy", TicketCategory.SECURITY, TicketSeverity.MEDIUM),
        ]

        # Check existing ticket count
        existing_tickets_cnt = await session.scalar(select(Ticket.id).limit(1))
        if not existing_tickets_cnt:
            logger.info("Generating realistic sample tickets for BI reporting...")
            for idx in range(1, 31):
                tid = f"#TK-{yymm}-{idx:04d}"
                loc = random.choice(all_locations)
                desc, cat, sev = random.choice(ticket_samples)
                created_hours_ago = random.randint(1, 72)
                t_created = now - timedelta(hours=created_hours_ago, minutes=random.randint(0, 50))

                # Determine status distribution
                if idx <= 15:
                    t_status = TicketStatus.RESOLVED
                    res_minutes = random.randint(10, 60)
                    t_resolved = t_created + timedelta(minutes=res_minutes)
                    csat = CSATRating.SATISFIED if random.random() > 0.15 else CSATRating.UNSATISFIED
                    csat_reason = "Xử lý rất nhanh và tận tâm" if csat == CSATRating.SATISFIED else "Đến chậm hơn 45 phút"
                elif idx <= 20:
                    t_status = TicketStatus.REOPENED
                    t_resolved = t_created + timedelta(minutes=40)
                    csat = CSATRating.UNSATISFIED
                    csat_reason = "Vấn đề sửa xong lại bị tái diễn sau 1 tiếng"
                elif idx <= 27:
                    t_status = TicketStatus.IN_PROGRESS
                    t_resolved = None
                    csat = None
                    csat_reason = None
                else:
                    t_status = TicketStatus.RECEIVED
                    t_resolved = None
                    csat = None
                    csat_reason = None

                ticket = Ticket(
                    id=tid,
                    location_id=loc.id,
                    category=cat,
                    severity=sev,
                    description=desc,
                    status=t_status,
                    reporter_phone=f"097{random.randint(1000000, 9999999)}",
                    reporter_name=f"Công nhân viên {idx}",
                    assigned_to_id=loc.manager_id,
                    resolved_by_id=loc.manager_id if t_resolved else None,
                    resolved_at=t_resolved,
                    resolved_note="Đã cử đội kỹ thuật/bảo vệ xử lý triệt để tại hiện trường." if t_resolved else None,
                    reopened_at=t_created + timedelta(minutes=90) if t_status == TicketStatus.REOPENED else None,
                    reopened_reason=csat_reason if t_status == TicketStatus.REOPENED else None,
                    csat_rating=csat,
                    csat_reason=csat_reason,
                    csat_submitted_at=t_resolved + timedelta(minutes=5) if t_resolved and csat else None,
                    created_at=t_created,
                    updated_at=t_resolved or t_created,
                )
                session.add(ticket)

            await session.commit()
            logger.info("Seeded 30 sample tickets successfully.")
        else:
            await session.commit()
            logger.info("Sample tickets already present.")

    logger.info("Seed process finished successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())
