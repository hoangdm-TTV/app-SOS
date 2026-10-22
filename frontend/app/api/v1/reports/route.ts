import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // BI & Analytics overview data theo Phần 6 đặc tả kỹ thuật
  const data = {
    overview: {
      totalReceived: 1240,
      totalResolved: 1210,
      resolveRate: 97.5,
      satisfactionRate: 92.4,
      avgResolutionMinutes: 28,
      inProgress: 18,
      reopened: 12,
    },
    peakHours: [
      { hour: '06:00 - 08:00', label: 'Sáng đón ca (Cao điểm)', count: 465, percentage: 37.5 },
      { hour: '11:30 - 13:00', label: 'Nghỉ trưa', count: 142, percentage: 11.5 },
      { hour: '17:30 - 19:30', label: 'Chiều trả ca (Cao điểm)', count: 488, percentage: 39.4 },
      { hour: 'Khác', label: 'Giờ hành chính & ban đêm', count: 145, percentage: 11.6 },
    ],
    hotspots: {
      topBuses: [
        { code: '29B-112.33', route: 'Tuyến Bắc Ninh 02', issuesCount: 14, mainIssue: 'Điều hòa yếu / Hỏng máy lạnh' },
        { code: '29B-098.11', route: 'Tuyến Hà Nội 01', issuesCount: 9, mainIssue: 'Đón muộn 15-20 phút' },
        { code: '29B-055.67', route: 'Tuyến Hải Dương', issuesCount: 6, mainIssue: 'Thái độ phụ xe' },
      ],
      topDorms: [
        { code: 'KTX C4 - Tầng 2', issuesCount: 18, mainIssue: 'Mất nước sinh hoạt' },
        { code: 'KTX B2 - Phòng 304', issuesCount: 11, mainIssue: 'Hỏng vòi tắm & quạt thông gió' },
        { code: 'KTX A1 - Tầng 1', issuesCount: 7, mainIssue: 'Mất điện chiếu sáng' },
      ],
    },
    leaderboard: {
      fastestTeam: 'KTX B1 (Xử lý trung bình: 14 phút)',
      lowestRatedTeam: 'Đội xe 03 (Tỷ lệ hài lòng: 81.2%)',
      categoriesBreakdown: [
        { category: 'Điều hòa / Điện nước cơ sở vật chất', percentage: 45 },
        { category: 'Chậm tuyến / Đón muộn', percentage: 30 },
        { category: 'Thái độ phục vụ', percentage: 25 },
      ],
    },
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(data);
}

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
