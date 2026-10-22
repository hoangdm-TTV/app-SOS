'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LocationHeader } from '@/components/sos/LocationHeader';
import { CallButton } from '@/components/sos/CallButton';
import { ReportForm } from '@/components/sos/ReportForm';
import { LocationInfo } from '@/lib/types';
import { api } from '@/lib/api';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function WorkerSosPage() {
  const params = useParams();
  const locationId = (params?.id as string) || '';

  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchLocationData = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await api.getLocation(id);
      setLocation(data);
    } catch (err: unknown) {
      console.error('Fetch location failed:', err);
      setError(
        err instanceof Error ? err.message : 'Không thể tải thông tin điểm quét QR'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchLocationData(locationId);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [locationId]);

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-slate-950 flex flex-col justify-between shadow-2xl relative">
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-4 h-4" />
            <span>Mất kết nối mạng - Hệ thống đã chuyển chế độ gọi trực tiếp Hotline</span>
          </div>
          <button
            onClick={() => fetchLocationData(locationId)}
            className="p-1 hover:bg-amber-700 rounded"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* 1. Header with emergency banner & Location info */}
        <LocationHeader
          location={location}
          loading={loading}
          error={error}
        />

        {/* 2. Primary 1-Touch SOS WebRTC Call Button */}
        <CallButton
          location={location}
        />

        {/* 3. Incident Report Form with Direct Camera snapshot */}
        <ReportForm
          location={location}
        />
      </div>

      {/* Persistent Emergency Hotline Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 p-3 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <span>Hệ thống cứu hộ 24/7 nội bộ</span>
          <span>•</span>
          <a
            href={`tel:${process.env.NEXT_PUBLIC_HOTLINE || '19001234'}`}
            className="text-red-400 font-bold hover:underline"
          >
            Hotline: {process.env.NEXT_PUBLIC_HOTLINE || '1900 1234'}
          </a>
        </div>
      </footer>
    </div>
  );
}
