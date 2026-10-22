'use client';

import React from 'react';
import { MapPin, Bus, Building2, ShieldAlert, Phone, User } from 'lucide-react';
import { LocationInfo } from '@/lib/types';

interface LocationHeaderProps {
  location: LocationInfo | null;
  loading: boolean;
  error?: string | null;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  location,
  loading,
  error,
}) => {
  return (
    <header className="w-full">
      {/* SOS Red/Orange Emergency Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-orange-600 text-white px-4 py-3 shadow-lg rounded-b-2xl border-b-2 border-red-500/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-black/20 rounded-full animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase leading-none">
                SOS KHẨN CẤP NỘI BỘ
              </h1>
              <p className="text-[11px] text-red-100 font-medium tracking-normal mt-0.5">
                Đường dây kết nối tức thì bộ phận điều hành & cứu hộ
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-red-700 uppercase tracking-widest shadow-sm">
            24/7
          </span>
        </div>
      </div>

      {/* Location Badge & Detailed Metadata */}
      <div className="px-4 pt-3 pb-1">
        {loading ? (
          /* Skeleton Loader */
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5 animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-slate-800 rounded-full"></div>
              <div className="h-5 bg-slate-800 rounded w-2/3"></div>
            </div>
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3.5 text-amber-200 text-sm">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              Không tìm thấy vị trí quét
            </div>
            <p className="text-xs text-amber-300/80 mt-1">
              {error}. Bạn vẫn có thể thực hiện cuộc gọi khẩn cấp bên dưới.
            </p>
          </div>
        ) : location ? (
          /* Active Location Info */
          <div className="bg-slate-900 border-2 border-red-500/30 rounded-2xl p-3.5 shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 mt-0.5 shrink-0">
                  {location.type === 'vehicle' ? (
                    <Bus className="w-6 h-6" />
                  ) : (
                    <Building2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                      {location.code}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Đang hoạt động
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                    {location.name}
                  </h2>
                  {location.route && (
                    <div className="flex items-center text-xs text-slate-300 mt-1 gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-medium line-clamp-1">{location.route}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-info: Supervisor / Driver contact */}
            {(location.driverName || location.supervisorName) && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px] text-slate-300">
                {location.driverName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Lái xe: <strong className="text-white">{location.driverName}</strong></span>
                    {location.driverPhone && (
                      <a
                        href={`tel:${location.driverPhone}`}
                        className="text-red-400 hover:underline ml-auto flex items-center gap-0.5 text-[11px]"
                      >
                        <Phone className="w-3 h-3" /> Gọi
                      </a>
                    )}
                  </div>
                )}
                {location.supervisorName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Phụ trách: <strong className="text-white">{location.supervisorName}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
