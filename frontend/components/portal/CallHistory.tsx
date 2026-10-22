'use client';

import React from 'react';
import { IncomingCallEvent } from '@/lib/types';
import { PhoneIncoming, PhoneCall, PhoneOff, Clock, MapPin, Bus, Building2 } from 'lucide-react';

interface CallHistoryProps {
  calls: IncomingCallEvent[];
  selectedCallId?: string;
  onSelectCall: (call: IncomingCallEvent) => void;
  onSimulateIncomingCall: () => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  calls,
  selectedCallId,
  onSelectCall,
  onSimulateIncomingCall,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-white text-base uppercase tracking-tight flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Hàng Đợi & Lịch Sử Cuộc Gọi ({calls.length})
          </h3>
          <p className="text-[11px] text-slate-400">Chọn cuộc gọi để xem Screen Pop và lập Ticket</p>
        </div>

        {/* Test Trigger Button for testing screen pop */}
        <button
          type="button"
          onClick={onSimulateIncomingCall}
          className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          <PhoneIncoming className="w-3.5 h-3.5" />
          <span>Mô phỏng gọi đến</span>
        </button>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
        {calls.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Hiện chưa có cuộc gọi nào.
          </div>
        ) : (
          calls.map((call) => {
            const isSelected = call.callId === selectedCallId;
            const isRinging = call.status === 'ringing';
            const isConnected = call.status === 'connected';

            return (
              <div
                key={call.callId}
                onClick={() => onSelectCall(call)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                } ${isRinging ? 'animate-pulse border-red-500 bg-red-950/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {call.callId}
                    </span>
                    {call.location.code && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        {call.location.code}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  {isRinging && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-bounce">
                      ĐANG ĐỔ CHUÔNG
                    </span>
                  )}
                  {isConnected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      ĐANG ĐÀM THOẠI
                    </span>
                  )}
                  {call.status === 'ended' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Đã kết thúc
                    </span>
                  )}
                  {call.status === 'missed' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                      Cuộc gọi nhỡ
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {call.location.type === 'vehicle' ? (
                    <Bus className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate">{call.location.name}</span>
                </div>

                {call.location.route && (
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{call.location.route}</span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(call.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span>
                    {call.callerNumber || 'Số nội bộ PWA'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
