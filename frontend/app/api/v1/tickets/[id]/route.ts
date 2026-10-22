import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;

  return NextResponse.json({
    id: ticketId,
    locationId: 'xe-29b-12345',
    locationName: 'Xe Tuyến 29B-123.45',
    categories: ['Cơ sở vật chất', 'Chậm tuyến'],
    description: 'Máy lạnh không hoạt động và xe xuất phát trễ 20 phút do hỏng lốp dự phòng.',
    priority: 'high',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    resolvedAt: new Date().toISOString(),
    resolutionSummary: 'Đội bảo trì đã thay thế điều hòa và bố trí xe tăng cường kịp thời.',
  });
}
