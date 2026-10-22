'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CallPopup } from '@/components/portal/CallPopup';
import { TicketForm } from '@/components/portal/TicketForm';
import { CallHistory } from '@/components/portal/CallHistory';
import { IncomingCallEvent, TicketRecord } from '@/lib/types';
import { api } from '@/lib/api';
import { Headphones, ShieldCheck, ArrowLeft, Phone, User, Clock, AlertCircle } from 'lucide-react';

export default function CallCenterPortalPage() {
  const [calls, setCalls] = useState<IncomingCallEvent[]>([]);
  const [selectedCall, setSelectedCall] = useState<IncomingCallEvent | null>(null);
  const [ringingCall, setRingingCall] = useState<IncomingCallEvent | null>(null);
  const [ticketsList, setTicketsList] = useState<TicketRecord[]>([]);

  // Load incoming calls on mount
  useEffect(() => {
    const fetchCalls = async () => {
      const data = await api.getIncomingCalls();
      setCalls(data);
      if (data.length > 0) {
        setSelectedCall(data[0]);
        // If there's an active ringing call, trigger screen pop
        const ringing = data.find((c) => c.status === 'ringing');
        if (ringing) {
          setRingingCall(ringing);
        }
      }
    };
    fetchCalls();
  }, []);

  // Handle Accept Call from Screen Pop
  const handleAcceptCall = (call: IncomingCallEvent) => {
    setCalls((prev) =>
      prev.map((c) => (c.callId === call.callId ? { ...c, status: 'connected' } : c))
    );
    setSelectedCall({ ...call, status: 'connected' });
    setRingingCall(null);
  };

  // Handle Reject Call from Screen Pop
  const handleRejectCall = (call: IncomingCallEvent) => {
    setCalls((prev) =>
      prev.map((c) => (c.callId === call.callId ? { ...c, status: 'missed' } : c))
    );
    setRingingCall(null);
  };

  // Simulate an incoming emergency call (for test demo)
  const handleSimulateIncomingCall = () => {
    const newId = `CALL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCall: IncomingCallEvent = {
      callId: newId,
      callerName: 'Công nhân ca 2 - Hoàng Văn A',
      callerNumber: '0912 999 888',
      location: {
        id: '29b-55588',
        code: 'BUS-29B-555.88',
        name: 'Xe Tuyến 29B-555.88',
        type: 'vehicle',
        route: 'Tuyến KCN Phố Nối ↔ Hà Nội',
        driverName: 'Đặng Quốc Huy',
        driverPhone: '0977 123 789',
        supervisorName: 'Nguyễn Tiến Dũng (Trực ban)',
        supervisorPhone: '0904 555 666',
        active: true,
      },
      startTime: new Date().toISOString(),
      status: 'ringing',
      recentTickets: [
        {
          id: 'TK-11022',
          category: 'Chậm tuyến',
          description: 'Hỏng hóc động cơ tại nút giao Vành đai 3',
          createdAt: '3 ngày trước',
          status: 'resolved',
        },
      ],
    };

    setCalls((prev) => [newCall, ...prev]);
    setSelectedCall(newCall);
    setRingingCall(newCall);
  };

  const handleTicketCreated = (newTicket: TicketRecord) => {
    setTicketsList((prev) => [newTicket, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Screen Pop Modal when ringing */}
      <CallPopup
        call={ringingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onClose={() => setRingingCall(null)}
      />

      {/* Portal Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Quay lại trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  CALL CENTER PORTAL - TỔNG ĐÀI ĐIỀU HÀNH SOS
                  <span className="text-[10px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
                    LIVE DISPATCH
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Hệ thống tiếp nhận cuộc gọi WebRTC, Screen Pop định vị & phân bổ điều phối
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tổng đài viên: <strong>Nguyễn Thị Mai (Agent #04)</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Portal Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Incoming & Pending Calls Queue (5 cols on lg) */}
        <div className="lg:col-span-5 h-full">
          <CallHistory
            calls={calls}
            selectedCallId={selectedCall?.callId}
            onSelectCall={(call) => setSelectedCall(call)}
            onSimulateIncomingCall={handleSimulateIncomingCall}
          />
        </div>

        {/* Column 2: Selected Call Details + Quick Ticket Form (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Call Overview Card */}
          {selectedCall ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase font-bold text-red-400 tracking-wider">
                    Chi tiết cuộc gọi đang chọn
                  </span>
                  <h2 className="text-lg font-black text-white">
                    {selectedCall.location.name}
                  </h2>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      selectedCall.status === 'connected'
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : selectedCall.status === 'ringing'
                        ? 'bg-red-600 text-white animate-bounce'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {selectedCall.status === 'connected'
                      ? 'Đang đàm thoại'
                      : selectedCall.status === 'ringing'
                      ? 'Đang đổ chuông'
                      : 'Đã hoàn thành'}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    ID: {selectedCall.callId}
                  </div>
                </div>
              </div>

              {/* Location & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 font-semibold block mb-0.5">Tuyến lộ trình:</span>
                  <span className="text-white font-medium">{selectedCall.location.route || 'Nội bộ nhà máy'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 font-semibold block mb-0.5">Lái xe phụ trách:</span>
                  <span className="text-white font-medium">
                    {selectedCall.location.driverName || 'N/A'}{' '}
                    {selectedCall.location.driverPhone && `(${selectedCall.location.driverPhone})`}
                  </span>
                </div>
              </div>

              {/* Call Controls if connected or ringing */}
              {selectedCall.status === 'connected' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Đang ghi âm cuộc đàm thoại (WebRTC Audio Stream)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCalls((prev) =>
                        prev.map((c) =>
                          c.callId === selectedCall.callId ? { ...c, status: 'ended' } : c
                        )
                      );
                      setSelectedCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Ngắt kết nối
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              Chọn một cuộc gọi trong danh sách bên trái để xem thông tin chi tiết Screen Pop.
            </div>
          )}

          {/* Quick Ticket Form */}
          <TicketForm
            currentLocation={selectedCall?.location}
            callId={selectedCall?.callId}
            onTicketCreated={handleTicketCreated}
          />
        </div>
      </main>
    </div>
  );
}
