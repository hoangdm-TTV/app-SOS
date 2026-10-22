'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, Phone, FileText, Loader2 } from 'lucide-react';
import { LocationInfo, IssueCategory, SOSReportPayload } from '@/lib/types';
import { CameraCapture } from './CameraCapture';
import { api } from '@/lib/api';

interface ReportFormProps {
  location: LocationInfo | null;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  'Sự cố xe / Hỏng hóc kỹ thuật',
  'Y tế / Cấp cứu khẩn cấp',
  'Va chạm / Tai nạn giao thông',
  'An ninh / Mâu thuẫn / Đe dọa',
  'Chậm tuyến / Bỏ chuyến',
  'Cơ sở vật chất / Vệ sinh kém',
  'Vấn đề khẩn cấp khác',
];

export const ReportForm: React.FC<ReportFormProps> = ({ location }) => {
  const [category, setCategory] = useState<IssueCategory>(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    ticketId?: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setErrorMessage('Đang tải thông tin vị trí, vui lòng thử lại sau giây lát.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập mô tả tóm tắt sự cố.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: SOSReportPayload = {
      locationId: location.id,
      locationName: location.name,
      category,
      description: description.trim(),
      senderPhone: senderPhone.trim() || undefined,
      photoBase64: photoBase64 || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await api.submitReport(payload);
      setSubmitSuccess({
        ticketId: res.ticketId,
        message: res.message || 'Đã gửi báo cáo khẩn cấp thành công!',
      });
      setDescription('');
      setPhotoBase64(null);
      setSenderPhone('');
    } catch (err: unknown) {
      console.error('Submit report error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể gửi tin báo. Vui lòng kiểm tra kết nối mạng hoặc gọi hotline trực tiếp!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 mb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
          <FileText className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-tight">
            Gửi Tin Báo Sự Cố
          </h2>
          <span className="text-[11px] text-slate-400 ml-auto">(Kèm ảnh hiện trường)</span>
        </div>

        {submitSuccess ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-base font-bold text-emerald-200">
              {submitSuccess.message}
            </div>
            {submitSuccess.ticketId && (
              <div className="text-xs text-emerald-300/80">
                Mã phiếu xử lý: <strong className="text-white font-mono bg-emerald-900/60 px-2 py-0.5 rounded">{submitSuccess.ticketId}</strong>
              </div>
            )}
            <p className="text-xs text-slate-300">
              Đội điều hành đã nhận được tọa độ và hình ảnh của bạn và đang triển khai xử lý.
            </p>
            <button
              type="button"
              onClick={() => setSubmitSuccess(null)}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Gửi thêm tin báo khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-700 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category Dropdown */}
            <div>
              <label
                htmlFor="issue-category"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Nhóm vấn đề khẩn cấp <span className="text-red-400">*</span>
              </label>
              <select
                id="issue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-red-500 font-medium"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white py-2">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <label
                htmlFor="issue-description"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Mô tả hiện trường / Vấn đề gặp phải <span className="text-red-400">*</span>
              </label>
              <textarea
                id="issue-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Xe nổ lốp tại trạm thu phí, cần hỗ trợ xe phụ hoặc cấp cứu y tế gấp..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none font-normal"
              />
            </div>

            {/* Camera Snapshot Upload (Camera-only, no gallery) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Hình ảnh hiện trường (Tùy chọn)
              </label>
              <CameraCapture
                onPhotoCaptured={setPhotoBase64}
                photoPreview={photoBase64}
              />
            </div>

            {/* Contact Phone (Optional) */}
            <div>
              <label
                htmlFor="sender-phone"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Số điện thoại liên hệ lại (Tùy chọn)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="sender-phone"
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="09xx xxx xxx (để tổng đài gọi lại cho bạn)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-black text-base uppercase tracking-wider bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang gửi dữ liệu...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  GỬI TIN BÁO KHẨN CẤP
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
