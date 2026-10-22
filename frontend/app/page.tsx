import Link from 'next/link';
import { AlertTriangle, PhoneCall, Headphones, Star, QrCode, ArrowRight, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-md mx-auto w-full px-4 py-8 flex flex-col min-h-screen justify-between">
      <div>
        {/* Top Header Badge */}
        <div className="flex items-center justify-center space-x-2 bg-red-950/60 border border-red-700/60 rounded-full px-4 py-1.5 w-fit mx-auto mb-6">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="text-xs font-bold tracking-wider text-red-200 uppercase">
            Hệ Thống Khẩn Cấp Nội Bộ PWA
          </span>
        </div>

        {/* Hero Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-red-600/10 border border-red-500/30 text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            CỔNG CỨU HỘ & PHẢN ÁNH SOS
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Zero-Install PWA: Công nhân chỉ cần quét mã QR dán trên xe hoặc tại phòng xưởng để gọi và gửi tin ngay lập tức.
          </p>
        </div>

        {/* Demo Fast Navigation */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Mô phỏng quét mã QR tại vị trí:
          </div>

          <Link
            href="/r/29b-12345"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  Xe Tuyến 29B-123.45
                  <span className="text-[10px] bg-red-600/80 text-white px-2 py-0.5 rounded-full font-medium">Xe Ca</span>
                </div>
                <div className="text-xs text-slate-400">
                  Tuyến Bắc Ninh ↔ KCN Thăng Long (Ca 1)
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
          </Link>

          <Link
            href="/r/xuong-c2"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  Xưởng Lắp Ráp 3 (Khu C2)
                  <span className="text-[10px] bg-amber-600/80 text-white px-2 py-0.5 rounded-full font-medium">Nhà Xưởng</span>
                </div>
                <div className="text-xs text-slate-400">
                  Phân xưởng A - Tòa nhà Sản xuất 2
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <div className="pt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Màn hình vận hành & Đánh giá:
          </div>

          <Link
            href="/portal"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-blue-900/40 hover:border-blue-500 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  Call Center Portal
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Tổng Đài Viên</span>
                </div>
                <div className="text-xs text-slate-400">
                  Màn hình Screen Pop, tiếp nhận cuộc gọi & tạo phiếu
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href="/csat/TK-84120"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-emerald-900/40 hover:border-emerald-500 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  Đánh Giá Hài Lòng (CSAT)
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">Phiếu TK-84120</span>
                </div>
                <div className="text-xs text-slate-400">
                  Khảo sát sau khi tổng đài xử lý sự cố thành công
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-purple-900/40 hover:border-purple-500 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  Báo Cáo & Phân Tích (BI)
                  <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium">Lãnh Đạo</span>
                </div>
                <div className="text-xs text-slate-400">
                  Heatmap điểm đen, KPI xử lý & khung giờ cao điểm
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-1">
        <div>Hệ Thống Điều Hành & Phản Ánh Cấp Tốc</div>
        <div>Hotline Trực Ban: <span className="text-red-400 font-bold">1900 1234</span> (24/7)</div>
      </footer>
    </div>
  );
}
