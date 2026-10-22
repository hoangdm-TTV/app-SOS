import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API POST /api/v1/reports] Received report:', body);

    const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Đã tiếp nhận báo cáo khẩn cấp. Bộ phận an toàn đang xử lý!',
      createdAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    );
  }
}
