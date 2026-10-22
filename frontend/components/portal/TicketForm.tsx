'use client';

import React, { useState, useEffect } from 'react';
import { TicketErrorCategory, TicketPriority, TicketPayload, TicketRecord, LocationInfo } from '@/lib/types';
import { api } from '@/lib/api';
import { Send, CheckCircle2, AlertTriangle, Layers, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface TicketFormProps {
  currentLocation?: LocationInfo | null;
  callId?: string;
  onTicketCreated?: (ticket: TicketRecord) => void;
}

const ERROR_CATEGORIES: TicketErrorCategory[] = [
  'Cơ sở vật chất',
  'Thái độ phục vụ',
  'Chậm tuyến',
  'An ninh',
  'Khác',
];

export const TicketForm: React.FC<TicketFormProps> = ({
  currentLocation,
  callId,
  onTicketCreated,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<TicketErrorCategory[]>(['Cơ sở vật chất']);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [department, setDepartment] = useState('Đội Vận Hành Cơ Động');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reset notification when call context changes
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [currentLocation?.id, callId]);

  const handleCategoryToggle = (category: TicketErrorCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập mô tả chi tiết sự cố để điều phối đội xử lý.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TicketPayload = {
      callId,
      locationId: currentLocation?.id || 'manual-entry',
      locationName: currentLocation?.name || 'Nhập thủ công tại quầy trực ban',
      categories: selectedCategories,
      description: description.trim(),
      priority,
      assignedDepartment: department,
    };

    try {
      const result = await api.createTicket(payload);
      setSuccessMessage(`Đã lập và điều phối phiếu số: ${result.id}`);
      setDescription('');
      onTicketCreated?.(result);
    } catch (err: unknown) {
      console.error('Create ticket error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi lưu phiếu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-white text-base uppercase tracking-tight">
            Tạo Phiếu Điều Phối Cấp Tốc (Quick Ticket)
          </h3>
        </div>
        {callId && (
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-700">
            Gắn với cuộc gọi: {callId}
          </span>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[11px] font-bold text-emerald-400 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/70 border border-red-500 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vị trí gắn liền */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Vị trí phát sinh:
          </label>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-sm font-semibold text-white">
            {currentLocation ? (
              <span>
                {currentLocation.name}{' '}
                <span className="text-xs text-red-400 font-mono">({currentLocation.code})</span>
              </span>
            ) : (
              <span className="text-slate-500 italic">Chưa chọn vị trí cuộc gọi</span>
            )}
          </div>
        </div>

        {/* Checkbox nhóm lỗi */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Nhóm lỗi / Phân loại sự cố:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ERROR_CATEGORIES.map((category) => {
              const checked = selectedCategories.includes(category);
              return (
                <label
                  key={category}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                    checked
                      ? 'bg-red-950/50 border-red-500 text-red-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 accent-red-600 rounded bg-slate-900 border-slate-700"
                  />
                  <span>{category}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Radio Mức độ ưu tiên: Cao (đỏ) / Thấp (xanh) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Mức độ khẩn cấp (Priority):
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Cao (Đỏ) */}
            <label
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                priority === 'high'
                  ? 'bg-red-950/60 border-red-600 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ticket-priority"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                  className="accent-red-600 w-4 h-4"
                />
                <span className="font-bold text-sm">Cao (Khẩn cấp)</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            </label>

            {/* Thấp (Xanh) */}
            <label
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                priority === 'low'
                  ? 'bg-emerald-950/60 border-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ticket-priority"
                  checked={priority === 'low'}
                  onChange={() => setPriority('low')}
                  className="accent-emerald-600 w-4 h-4"
                />
                <span className="font-bold text-sm">Thấp (Bình thường)</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </label>
          </div>
        </div>

        {/* Textarea Mô tả */}
        <div>
          <label
            htmlFor="ticket-desc"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Nội dung chi tiết & Chỉ đạo xử lý:
          </label>
          <textarea
            id="ticket-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú tóm tắt nội dung trao đổi qua điện thoại với công nhân viên..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Điều phối tới phòng ban */}
        <div>
          <label
            htmlFor="ticket-dept"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
          >
            Đơn vị tiếp nhận điều phối:
          </label>
          <select
            id="ticket-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="Đội Vận Hành Cơ Động">Đội Vận Hành Cơ Động (Xe ứng cứu)</option>
            <option value="Ban An Toàn & Bảo Hộ Lao Động">Ban An Toàn & Bảo Hộ Lao Động</option>
            <option value="Tổ Y Tế Cơ Sở 24/7">Tổ Y Tế Cơ Sở 24/7</option>
            <option value="Đội Cơ Điện - CSVC">Đội Cơ Điện - CSVC</option>
            <option value="Ban Nhân Sự & Chế Độ">Ban Nhân Sự & Chế Độ</option>
          </select>
        </div>

        {/* Nút [Lưu & Điều phối] */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu và gửi điều phối...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              LƯU & ĐIỀU PHỐI TICKET
            </>
          )}
        </button>
      </form>
    </div>
  );
};
