'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, AlertCircle, Clock } from 'lucide-react';
import { LocationInfo } from '@/lib/types';
import { webRtcSosService, CallStatus } from '@/lib/webrtc';

interface CallButtonProps {
  location: LocationInfo | null;
  hotline?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  location,
  hotline = process.env.NEXT_PUBLIC_HOTLINE || '19001234',
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (webRtcSosService.getStatus() !== 'idle') {
        webRtcSosService.endCall();
      }
    };
  }, []);

  const handleStartCall = async () => {
    if (!location) {
      alert('Đang tải dữ liệu vị trí, vui lòng đợi giây lát!');
      return;
    }

    setFallbackWarning(null);

    await webRtcSosService.startCall({
      location,
      hotline,
      onStatusChange: (status, message) => {
        setCallStatus(status);
        if (message) setStatusMessage(message);
      },
      onDurationTick: (sec) => {
        setDuration(sec);
      },
      onFallback: (reason) => {
        setFallbackWarning(
          `Đã tự động chuyển tiếp sang đường dây thoại: ${hotline} (Lý do: ${reason})`
        );
      },
    });
  };

  const handleHangup = () => {
    webRtcSosService.endCall();
    setCallStatus('idle');
    setDuration(0);
  };

  const handleToggleMute = () => {
    const muted = webRtcSosService.toggleMute();
    setIsMuted(muted);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCalling =
    callStatus === 'requesting_permission' ||
    callStatus === 'connecting' ||
    callStatus === 'ringing' ||
    callStatus === 'connected';

  return (
    <div className="w-full px-4 my-3">
      {!isCalling ? (
        /* Standby State: Big Green Call Button */
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleStartCall}
            aria-label="Gọi tổng đài SOS 1 chạm"
            className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-[0.98] text-white font-black rounded-2xl py-5 px-6 shadow-2xl border-2 border-emerald-400/60 transition-all flex items-center justify-center space-x-3 sos-call-pulse"
          >
            <div className="p-2.5 bg-white/20 rounded-full animate-bounce">
              <PhoneCall className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow">
                GỌI TỔNG ĐÀI SOS
              </div>
              <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                <span>(1 CHẠM - MIỄN PHÍ QUA INTERNET)</span>
              </div>
            </div>
          </button>

          {/* Quick Fallback Note & Direct Tel link */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>Tự động chuyển tiếp nếu mất mạng:</span>
            <a
              href={`tel:${hotline}`}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> Gọi Hotline: {hotline}
            </a>
          </div>

          {fallbackWarning && (
            <div className="p-3 bg-amber-900/40 border border-amber-600 rounded-xl text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{fallbackWarning}</span>
            </div>
          )}
        </div>
      ) : (
        /* Active In-Call State */
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl animate-fade-in text-center relative overflow-hidden">
          {/* Subtle audio waves animated background */}
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Status indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {callStatus === 'connected' ? 'Đang trong cuộc gọi' : 'Đang thiết lập...'}
            </div>

            <div className="text-base font-bold text-white mb-1">
              Tổng Đài Điều Hành Khẩn Cấp
            </div>
            <p className="text-xs text-slate-300">
              Vị trí: <strong className="text-emerald-400">{location?.name}</strong>
            </p>

            {/* Timer or Status Message */}
            <div className="my-4 py-2 px-4 rounded-xl bg-slate-950/80 border border-slate-800 inline-block min-w-[140px]">
              {callStatus === 'connected' ? (
                <div className="flex items-center justify-center gap-1.5 text-2xl font-mono font-bold text-white tracking-widest">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  {formatTimer(duration)}
                </div>
              ) : (
                <div className="text-sm font-semibold text-emerald-300 animate-pulse">
                  {statusMessage || 'Đang gọi tổng đài...'}
                </div>
              )}
            </div>

            {/* Action Buttons: Mute / Hangup */}
            <div className="grid grid-cols-2 gap-3 mt-2 max-w-xs mx-auto">
              {/* Mute button */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border ${
                  isMuted
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Bật Mic
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-emerald-400" />
                    Tắt Mic
                  </>
                )}
              </button>

              {/* End Call button */}
              <button
                type="button"
                onClick={handleHangup}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm bg-red-600 hover:bg-red-500 active:scale-95 text-white border border-red-400 shadow-lg shadow-red-900/40 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
