'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  Home,
  RefreshCw,
  Smile,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

interface ReportData {
  overview: {
    totalReceived: number;
    totalResolved: number;
    resolveRate: number;
    satisfactionRate: number;
    avgResolutionMinutes: number;
    inProgress: number;
    reopened: number;
  };
  peakHours: Array<{
    hour: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  hotspots: {
    topBuses: Array<{
      code: string;
      route: string;
      issuesCount: number;
      mainIssue: string;
    }>;
    topDorms: Array<{
      code: string;
      issuesCount: number;
      mainIssue: string;
    }>;
  };
  leaderboard: {
    fastestTeam: string;
    lowestRatedTeam: string;
    categoriesBreakdown: Array<{
      category: string;
      percentage: number;
    }>;
  };
  updatedAt: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reports');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Realtime Analytics
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                BÁO CÁO QUẢN TRỊ & VẬN HÀNH SOS
              </h1>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới số liệu</span>
          </button>
        </div>

        {/* 4 Block BI Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KHỐI 1: TỔNG QUAN TÌNH HÌNH */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-white">1. Tổng Quan Tình Hình</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
                Tháng hiện tại
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                <div className="text-xs text-slate-400 font-medium">Tổng tiếp nhận</div>
                <div className="text-2xl font-black text-white mt-1">
                  {data?.overview.totalReceived.toLocaleString() ?? '1,240'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">cuộc gọi & tin báo</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                <div className="text-xs text-slate-400 font-medium">Đã giải quyết</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {data?.overview.totalResolved.toLocaleString() ?? '1,210'}
                </div>
                <div className="text-[11px] text-emerald-500 font-medium mt-0.5">
                  Tỷ lệ: {data?.overview.resolveRate ?? '97.5'}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                <div className="text-xs text-slate-400 font-medium">Tỷ lệ Hài lòng</div>
                <div className="text-2xl font-black text-blue-400 mt-1">
                  {data?.overview.satisfactionRate ?? '92.4'}%
                </div>
                <div className="text-[11px] text-blue-500 mt-0.5">CSAT khảo sát</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                <div className="text-xs text-slate-400 font-medium">Thời gian xử lý TB</div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {data?.overview.avgResolutionMinutes ?? '28'}
                  <span className="text-xs font-normal text-slate-400 ml-1">phút</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Mục tiêu &lt; 30p</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Đang trong tiến trình xử lý:</span>
                <span className="font-bold text-amber-400">{data?.overview.inProgress ?? 18} vụ</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-slate-300">Reopened (Chưa hài lòng):</span>
                <span className="font-bold text-red-400">{data?.overview.reopened ?? 12} vụ</span>
              </div>
            </div>
          </div>

          {/* KHỐI 2: BIỂU ĐỒ THEO KHUNG GIỜ */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-white">2. Phân Bố Theo Khung Giờ</h2>
              </div>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium border border-amber-500/20">
                2 Đỉnh cao điểm
              </span>
            </div>

            <div className="space-y-3.5">
              {data?.peakHours.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      {item.hour} — <span className="font-normal text-slate-400">{item.label}</span>
                    </span>
                    <span className="font-bold text-white">
                      {item.count} vụ ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percentage > 30 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
              💡 <strong>Khuyến nghị vận hành:</strong> Bố trí trực tăng cường 100% nhân sự trực đàm thoại vào 2 khung giờ vàng: <strong>06:00 - 08:00 sáng</strong> và <strong>17:30 - 19:30 chiều tan ca</strong>.
            </div>
          </div>

          {/* KHỐI 3: HEATMAP ĐIỂM ĐEN SỰ CỐ */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-white">3. Heatmap "Điểm Đen" Sự Cố</h2>
              </div>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
                Cần can thiệp
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-red-400" />
                  Top Xe Ca Bị Phản Ánh Nhiều Nhất:
                </div>
                <div className="space-y-2">
                  {data?.hotspots.topBuses.map((bus, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-red-400 text-sm w-4">#{idx + 1}</span>
                        <div>
                          <div className="font-bold text-white">{bus.code} ({bus.route})</div>
                          <div className="text-slate-400 text-[11px]">{bus.mainIssue}</div>
                        </div>
                      </div>
                      <span className="font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-full">
                        {bus.issuesCount} phản ánh
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-amber-400" />
                  Top Khu Vực KTX Hay Gặp Sự Cố:
                </div>
                <div className="space-y-2">
                  {data?.hotspots.topDorms.map((dorm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-amber-400 text-sm w-4">#{idx + 1}</span>
                        <div>
                          <div className="font-bold text-white">{dorm.code}</div>
                          <div className="text-slate-400 text-[11px]">{dorm.mainIssue}</div>
                        </div>
                      </div>
                      <span className="font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full">
                        {dorm.issuesCount} phản ánh
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 4: BẢNG XẾP HẠNG VẬN HÀNH */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-white">4. Bảng Xếp Hạng Vận Hành</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
                Đánh giá KPI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Đơn vị xử lý nhanh nhất:
                </div>
                <div className="font-black text-white text-sm">
                  {data?.leaderboard.fastestTeam ?? 'KTX B1'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs space-y-1">
                <div className="text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Đơn vị đánh giá kém nhất:
                </div>
                <div className="font-black text-white text-sm">
                  {data?.leaderboard.lowestRatedTeam ?? 'Đội xe 03'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Tỷ lệ phân loại nguyên nhân sự cố:
              </div>
              <div className="space-y-2.5">
                {data?.leaderboard.categoriesBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{cat.category}</span>
                      <span className="font-bold text-white">{cat.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
