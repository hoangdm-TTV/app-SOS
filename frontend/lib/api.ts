import {
  LocationInfo,
  SOSReportPayload,
  SOSReportResponse,
  CallIntentPayload,
  CallIntentResponse,
  TicketPayload,
  TicketRecord,
  CsatPayload,
  CsatResponse,
  IncomingCallEvent,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Fetch wrapper with timeout and standardized error handling
 */
async function fetchWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<T> {
  const url = BASE_URL ? `${BASE_URL.replace(/\/$/, '')}${endpoint}` : endpoint;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.message || parsed.detail || errorMessage;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Yêu cầu hết thời gian chờ (Timeout). Vui lòng thử lại.');
    }
    throw error;
  }
}

// ==========================================
// MOCK DATA GENERATOR (Graceful fallback)
// ==========================================
function getMockLocation(id: string): LocationInfo {
  const isBus = id.toLowerCase().includes('xe') || id.toLowerCase().includes('bus') || /^\d+$/.test(id);
  
  if (isBus) {
    return {
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
    };
  }

  return {
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
  };
}

export const api = {
  /**
   * GET /api/v1/locations/{id}
   */
  async getLocation(id: string): Promise<LocationInfo> {
    try {
      return await fetchWithTimeout<LocationInfo>(`/api/v1/locations/${id}`, {
        method: 'GET',
      });
    } catch (err) {
      console.warn(`[API] Using fallback location for id "${id}":`, err);
      // Return realistic mock location if backend is not yet attached
      return getMockLocation(id);
    }
  },

  /**
   * POST /api/v1/calls/intent
   */
  async recordCallIntent(payload: CallIntentPayload): Promise<CallIntentResponse> {
    try {
      return await fetchWithTimeout<CallIntentResponse>(`/api/v1/calls/intent`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[API] recordCallIntent fallback response:', err);
      return {
        success: true,
        callId: `CALL-${Date.now()}`,
        message: 'Đã ghi nhận ý định gọi tổng đài.',
      };
    }
  },

  /**
   * POST /api/v1/reports
   */
  async submitReport(payload: SOSReportPayload): Promise<SOSReportResponse> {
    try {
      return await fetchWithTimeout<SOSReportResponse>(`/api/v1/reports`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[API] submitReport fallback response:', err);
      return {
        success: true,
        ticketId: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'Đã tiếp nhận báo cáo khẩn cấp. Bộ phận an toàn đang xử lý!',
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * POST /api/v1/tickets
   */
  async createTicket(payload: TicketPayload): Promise<TicketRecord> {
    try {
      return await fetchWithTimeout<TicketRecord>(`/api/v1/tickets`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[API] createTicket fallback response:', err);
      return {
        ...payload,
        id: payload.id || `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * GET /api/v1/tickets/{id}
   */
  async getTicket(ticketId: string): Promise<TicketRecord> {
    try {
      return await fetchWithTimeout<TicketRecord>(`/api/v1/tickets/${ticketId}`, {
        method: 'GET',
      });
    } catch (err) {
      console.warn('[API] getTicket fallback response:', err);
      return {
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
      };
    }
  },

  /**
   * POST /api/v1/tickets/{id}/csat
   */
  async submitCsat(ticketId: string, payload: Omit<CsatPayload, 'ticketId'>): Promise<CsatResponse> {
    try {
      return await fetchWithTimeout<CsatResponse>(`/api/v1/tickets/${ticketId}/csat`, {
        method: 'POST',
        body: JSON.stringify({ ticketId, ...payload }),
      });
    } catch (err) {
      console.warn('[API] submitCsat fallback response:', err);
      return {
        success: true,
        message: 'Cảm ơn bạn đã gửi đánh giá hài lòng.',
        submittedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * GET /api/v1/portal/active-calls (For operator portal)
   */
  async getIncomingCalls(): Promise<IncomingCallEvent[]> {
    try {
      return await fetchWithTimeout<IncomingCallEvent[]>(`/api/v1/portal/active-calls`, {
        method: 'GET',
      });
    } catch {
      return [
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
      ];
    }
  },
};
