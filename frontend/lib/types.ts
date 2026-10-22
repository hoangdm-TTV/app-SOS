/**
 * TypeScript Interfaces for SOS Internal PWA
 */

export type LocationType = 'vehicle' | 'room' | 'factory' | 'other';

export interface LocationInfo {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  route?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  driverName?: string;
  driverPhone?: string;
  department?: string;
  address?: string;
  active: boolean;
}

export type IssueCategory =
  | 'Sự cố xe / Hỏng hóc kỹ thuật'
  | 'Y tế / Cấp cứu khẩn cấp'
  | 'Va chạm / Tai nạn giao thông'
  | 'An ninh / Mâu thuẫn / Đe dọa'
  | 'Chậm tuyến / Bỏ chuyến'
  | 'Cơ sở vật chất / Vệ sinh kém'
  | 'Vấn đề khẩn cấp khác';

export interface SOSReportPayload {
  locationId: string;
  locationName: string;
  category: IssueCategory | string;
  description: string;
  photoBase64?: string;
  senderPhone?: string;
  timestamp?: string;
}

export interface SOSReportResponse {
  success: boolean;
  ticketId?: string;
  message: string;
  createdAt: string;
}

export interface CallIntentPayload {
  locationId: string;
  locationName: string;
  callType: 'webrtc' | 'tel_fallback';
  status: 'initiated' | 'connected' | 'failed' | 'fallback_redirected';
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CallIntentResponse {
  success: boolean;
  callId: string;
  message: string;
}

export type TicketErrorCategory =
  | 'Cơ sở vật chất'
  | 'Thái độ phục vụ'
  | 'Chậm tuyến'
  | 'An ninh'
  | 'Khác';

export type TicketPriority = 'high' | 'low';

export interface TicketPayload {
  id?: string;
  callId?: string;
  locationId: string;
  locationName: string;
  categories: TicketErrorCategory[];
  description: string;
  priority: TicketPriority;
  assignedDepartment?: string;
  assignedStaff?: string;
}

export interface TicketRecord extends TicketPayload {
  id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  resolutionSummary?: string;
}

export type CsatRating = 'satisfied' | 'unsatisfied';

export type CsatUnsatisfiedReason =
  | 'Chưa giải quyết triệt để'
  | 'Thái độ kém'
  | 'Quá chậm trễ';

export interface CsatPayload {
  ticketId: string;
  rating: CsatRating;
  reasons?: CsatUnsatisfiedReason[];
  feedback?: string;
}

export interface CsatResponse {
  success: boolean;
  message: string;
  submittedAt: string;
}

export interface IncomingCallEvent {
  callId: string;
  callerNumber?: string;
  callerName?: string;
  location: LocationInfo;
  startTime: string;
  status: 'ringing' | 'connected' | 'ended' | 'missed';
  durationSeconds?: number;
  recentTickets: Array<{
    id: string;
    category: string;
    description: string;
    createdAt: string;
    status: 'resolved' | 'pending' | 'in_progress';
  }>;
}
