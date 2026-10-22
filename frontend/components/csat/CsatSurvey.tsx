'use client';

import React, { useState } from 'react';
import { CsatRating, CsatUnsatisfiedReason, TicketRecord } from '@/lib/types';
import { api } from '@/lib/api';
import { Smile, Frown, CheckCircle2, AlertTriangle, Send, Loader2, Sparkles } from 'lucide-react';

interface CsatSurveyProps {
  ticket: TicketRecord;
  onSubmitted?: () => void;
}

const UNSATISFIED_REASONS: CsatUnsatisfiedReason[] = [
  'Chưa giải quyết triệt để',
  'Thái độ kém',
  'Quá chậm trễ',
];

export const CsatSurvey: React.FC<CsatSurveyProps> = ({ ticket, onSubmitted }) => {
  const [rating, setRating] = useState<CsatRating | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<CsatUnsatisfiedReason[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReasonToggle = (reason: CsatUnsatisfiedReason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setErrorMessage('Vui lòng chọn mức độ hài lòng của bạn.');
      return;
    }

    if (rating === 'unsatisfied' && selectedReasons.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một lý do bạn chưa hài lòng.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.submitCsat(ticket.id, {
        rating,
        reasons: rating === 'unsatisfied' ? selectedReasons : undefined,
        feedback: feedback.trim() || undefined,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: unknown) {
      console.error('Submit CSAT failed:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi khi gửi khảo sát, vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-white">
          CẢM ƠN Ý KIẾN ĐÓNG GÓP CỦA BẠN!
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
          Phản hồi của bạn đã được chuyển tới Ban Quản lý Chất lượng Dịch vụ để không ngừng nâng cao trải nghiệm công nhân viên.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
      <div className="text-center mb-6">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
          Khảo sát chất lượng dịch vụ
        </span>
        <h2 className="text-lg sm:text-xl font-black text-white mt-1">
          BẠN CÓ HÀI LÒNG VỚI KẾT QUẢ XỬ LÝ KHÔNG?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Đánh giá này giúp cải thiện trực tiếp thái độ và tốc độ ứng cứu SOS.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/70 border border-red-500 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2 Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rất hài lòng - Green */}
          <button
            type="button"
            onClick={() => {
              setRating('satisfied');
              setSelectedReasons([]);
            }}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              rating === 'satisfied'
                ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-emerald-600/60 text-slate-300'
            }`}
          >
            <div className={`p-3 rounded-full mb-2 ${rating === 'satisfied' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400'}`}>
              <Smile className="w-10 h-10" />
            </div>
            <span className="text-base font-black text-white">RẤT HÀI LÒNG</span>
            <span className="text-xs text-emerald-300 mt-0.5">Xử lý nhanh, hiệu quả</span>
          </button>

          {/* Chưa hài lòng - Red */}
          <button
            type="button"
            onClick={() => setRating('unsatisfied')}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              rating === 'unsatisfied'
                ? 'bg-red-950/70 border-red-500 shadow-lg shadow-red-900/40 ring-2 ring-red-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-red-600/60 text-slate-300'
            }`}
          >
            <div className={`p-3 rounded-full mb-2 ${rating === 'unsatisfied' ? 'bg-red-500 text-white' : 'bg-slate-800 text-red-400'}`}>
              <Frown className="w-10 h-10" />
            </div>
            <span className="text-base font-black text-white">CHƯA HÀI LÒNG</span>
            <span className="text-xs text-red-300 mt-0.5">Cần khắc phục thêm</span>
          </button>
        </div>

        {/* 3 Checkboxes if Chưa hài lòng */}
        {rating === 'unsatisfied' && (
          <div className="bg-slate-950 border border-red-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
            <label className="block text-xs font-bold text-red-400 uppercase tracking-wider">
              Lý do bạn chưa hài lòng (Chọn ít nhất 1): <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {UNSATISFIED_REASONS.map((reason) => {
                const isChecked = selectedReasons.includes(reason);
                return (
                  <label
                    key={reason}
                    className={`flex items-center space-x-3 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-red-950/60 border-red-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleReasonToggle(reason)}
                      className="w-5 h-5 accent-red-600 rounded bg-slate-950 border-slate-700"
                    />
                    <span>{reason}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Comment */}
        <div>
          <label
            htmlFor="csat-comment"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Góp ý thêm cho đội ngũ phục vụ (Tùy chọn):
          </label>
          <textarea
            id="csat-comment"
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Chia sẻ thêm cảm nhận hoặc đề xuất cải thiện..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit Survey Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rating}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider text-white shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            rating === 'satisfied'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
              : 'bg-red-600 hover:bg-red-500 shadow-red-900/40'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang gửi đánh giá...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              GỬI ĐÁNH GIÁ CỦA BẠN
            </>
          )}
        </button>
      </form>
    </div>
  );
};
