import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API POST /api/v1/tickets] Created ticket:', body);

    const newTicket = {
      ...body,
      id: body.id || `TK-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newTicket);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Lỗi tạo ticket' },
      { status: 400 }
    );
  }
}
