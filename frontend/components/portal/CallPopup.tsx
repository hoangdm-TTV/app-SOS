'use client';

import React from 'react';
import { PhoneIncoming, PhoneOff, Phone, MapPin, User, History, X, Bus, Building2 } from 'lucide-react';
import { IncomingCallEvent } from '@/lib/types';

interface CallPopupProps {
  call: IncomingCallEvent | null;
  onAccept: (call: IncomingCallEvent) => void;
  onReject: (call: IncomingCallEvent) => void;
  onClose: () => void;
}

export const CallPopup: React.FC<CallPopupProps> = ({
  call,
  onAccept,
  onReject,
  onClose,
}) => {
  if (!call || call.status !== 'ringing') return null;

  const loc = call.location;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden animate-bounce-short">
        {/* Screen Pop Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full animate-ping">
              <PhoneIncoming className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-red-100">
                SCREEN POP - CUỘC GỌI KHẨN CẤP ĐẾN
              </div>
              <div className="text-lg font-black tracking-tight">
                Mã: {call.callId}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Location info */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                {loc.type === 'vehicle' ? (
                  <Bus className="w-6 h-6" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  {loc.code}
                </div>
                <div className="text-lg font-bold text-white leading-snug">
                  {loc.name}
                </div>
                {loc.route && (
                  <div className="flex items-center text-xs text-slate-300 mt-1 gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{loc.route}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Officers in charge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Lái xe / Điều hành:
              </div>
              <div className="text-white font-bold">{loc.driverName || 'Chưa cập nhật'}</div>
              {loc.driverPhone && (
                <div className="text-emerald-400 font-mono mt-0.5">{loc.driverPhone}</div>
              )}
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Cán bộ phụ trách:
              </div>
              <div className="text-white font-bold">{loc.supervisorName || 'Ban An Toàn Vận Hành'}</div>
              {loc.supervisorPhone && (
                <div className="text-emerald-400 font-mono mt-0.5">{loc.supervisorPhone}</div>
              )}
            </div>
          </div>

          {/* Recent History */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <History className="w-4 h-4 text-amber-400" />
              Lịch sử phản ánh gần đây của vị trí này:
            </div>
            {call.recentTickets && call.recentTickets.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {call.recentTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{t.category}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({t.createdAt})</span>
                      </div>
                      <div className="text-slate-400 truncate max-w-xs">{t.description}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                      Đã xử lý
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-950 rounded-lg">
                Không có sự cố nào trong 30 ngày qua
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onReject(call)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PhoneOff className="w-4 h-4 text-red-400" />
              Từ chối
            </button>
            <button
              type="button"
              onClick={() => onAccept(call)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-900/40 transition-colors"
            >
              <Phone className="w-4 h-4 text-white" />
              TIẾP NHẬN CUỘC GỌI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
