import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const body = await request.json();
    console.log(`[API POST /api/v1/tickets/${ticketId}/csat] Received CSAT review:`, body);

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá hài lòng.',
      submittedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    );
  }
}
