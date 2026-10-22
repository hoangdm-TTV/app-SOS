import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API POST /api/v1/calls/intent] Received call intent:', body);

    return NextResponse.json({
      success: true,
      callId: `CALL-${Date.now()}`,
      message: 'Đã tiếp nhận và ghi log ý định gọi tổng đài SOS.',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    );
  }
}
