'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TicketRecord } from '@/lib/types';
import { api } from '@/lib/api';
import { CsatSurvey } from '@/components/csat/CsatSurvey';
import { CheckCircle2, Clock, MapPin, Tag, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function TicketCsatPage() {
  const params = useParams();
  const ticketId = (params?.ticket_id as string) || '';

  const [ticket, setTicket] = useState<TicketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getTicket(ticketId);
        setTicket(data);
      } catch (err: unknown) {
        console.error('Failed to load ticket:', err);
        setError(err instanceof Error ? err.message : 'Không tìm thấy phiếu yêu cầu');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-slate-950 px-4 py-6 flex flex-col justify-between">
      <div>
        {/* Top bar back link */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            {ticketId}
          </span>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-6 bg-slate-800 rounded w-2/3"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-64"></div>
          </div>
        ) : error ? (
          <div className="bg-red-950/40 border border-red-700/60 rounded-2xl p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Không tìm thấy thông tin phiếu</h3>
            <p className="text-xs text-red-200">{error}</p>
            <Link
              href="/"
              className="inline-block mt-2 px-4 py-2 bg-slate-800 text-xs font-bold rounded-lg text-white"
            >
              Về trang chủ
            </Link>
          </div>
        ) : ticket ? (
          <div className="space-y-4">
            {/* Resolution Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sự cố đã được xử lý xong
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                </span>
              </div>

              <div className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>{ticket.locationName}</span>
              </div>

              {ticket.categories && (
                <div className="flex flex-wrap gap-1.5 my-2">
                  {ticket.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <strong className="text-slate-400 block mb-0.5">Nội dung đã khắc phục:</strong>
                <p className="text-slate-200">
                  {ticket.resolutionSummary || 'Bộ phận kỹ thuật & điều phối đã cử lực lượng hỗ trợ hiện trường và hoàn tất xử lý.'}
                </p>
              </div>
            </div>

            {/* CSAT Survey Component */}
            <CsatSurvey ticket={ticket} />
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Hệ thống khảo sát chất lượng dịch vụ SOS Nội Bộ
      </footer>
    </div>
  );
}
