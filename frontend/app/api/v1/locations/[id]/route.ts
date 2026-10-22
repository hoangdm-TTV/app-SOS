import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const isBus =
    id.toLowerCase().includes('xe') ||
    id.toLowerCase().includes('bus') ||
    /^\d+$/.test(id) ||
    id.toLowerCase().includes('29b');

  if (isBus) {
    return NextResponse.json({
      id,
      code: `BUS-${id.toUpperCase()}`,
      name: `Xe Tuyến 29B-${id.slice(0, 5) || '123.45'}`,
      type: 'vehicle',
      route: 'Tuyến Bắc Ninh ↔ KCN Thăng Long (Ca 1)',
      driverName: 'Nguyễn Văn Hùng',
      driverPhone: '0987 654 321',
      supervisorName: 'Trần Đình Trọng (Đội xe 2)',
      supervisorPhone: '0912 345 678',
      department: 'Ban Quản trị Đội xe Vận tải',
      active: true,
    });
  }

  return NextResponse.json({
    id,
    code: `ROOM-${id.toUpperCase()}`,
    name: `Xưởng Lắp Ráp 3 - Khu Vực ${id.toUpperCase()}`,
    type: 'room',
    route: 'Phân xưởng A - Tòa nhà Sản xuất 2',
    supervisorName: 'Lê Hoàng Nam (Quản đốc ca)',
    supervisorPhone: '0903 888 999',
    department: 'Khối Sản Xuất & Vận Hành',
    address: 'Tầng 2, Nhà máy C, Khu công nghiệp',
    active: true,
  });
}
