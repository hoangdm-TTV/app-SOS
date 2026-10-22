import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      callId: 'CALL-9021',
      callerName: 'Công nhân ca 1',
      callerNumber: '0988 123 456',
      location: {
        id: '29b-12345',
        code: 'BUS-29B-123.45',
        name: 'Xe Tuyến 29B-123.45',
        type: 'vehicle',
        route: 'Tuyến Bắc Ninh ↔ KCN Thăng Long (Ca 1)',
        driverName: 'Nguyễn Văn Hùng',
        driverPhone: '0987 654 321',
        supervisorName: 'Trần Đình Trọng (Đội xe 2)',
        supervisorPhone: '0912 345 678',
        department: 'Đội xe Vận tải',
        active: true,
      },
      startTime: new Date().toISOString(),
      status: 'ringing',
      recentTickets: [
        {
          id: 'TK-84120',
          category: 'Cơ sở vật chất',
          description: 'Máy lạnh khoang hành khách không mát',
          createdAt: '2 ngày trước',
          status: 'resolved',
        },
        {
          id: 'TK-79102',
          category: 'Chậm tuyến',
          description: 'Trễ giờ đón do kẹt xe cầu Thăng Long',
          createdAt: 'Tuần trước',
          status: 'resolved',
        },
      ],
    },
    {
      callId: 'CALL-9020',
      callerName: 'Công nhân xưởng C',
      callerNumber: '0977 444 555',
      location: {
        id: 'xuong-c2',
        code: 'ROOM-C2-04',
        name: 'Phòng Kỹ Thuật Dây Chuyền 2 (Xưởng C)',
        type: 'room',
        route: 'Nhà máy A - Khu sản xuất',
        supervisorName: 'Vũ Văn Hào (Trưởng ca kỹ thuật)',
        supervisorPhone: '0933 222 111',
        department: 'Phòng Cơ Điện',
        active: true,
      },
      startTime: new Date(Date.now() - 120000).toISOString(),
      status: 'connected',
      durationSeconds: 120,
      recentTickets: [
        {
          id: 'TK-65129',
          category: 'An ninh',
          description: 'Cửa thoát hiểm bị kẹt chốt khóa',
          createdAt: 'Hôm qua',
          status: 'in_progress',
        },
      ],
    },
  ]);
}
