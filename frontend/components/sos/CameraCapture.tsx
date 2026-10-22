'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  onPhotoCaptured: (base64Photo: string | null) => void;
  photoPreview: string | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCaptured,
  photoPreview,
}) => {
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream when modal closes
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const openLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập Camera trực tiếp.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Back camera for incident reporting
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Live camera stream error, falling back to capture input:', err);
      stopStream();
      setIsLiveCameraOpen(false);
      // Fallback: trigger native camera via <input capture="environment">
      fileInputRef.current?.click();
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onPhotoCaptured(dataUrl);
      stopStream();
      setIsLiveCameraOpen(false);
    }
  };

  const handleCloseModal = () => {
    stopStream();
    setIsLiveCameraOpen(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onPhotoCaptured(result);
    };
    reader.readAsDataURL(file);
    // reset input so user can take another photo if desired
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    onPhotoCaptured(null);
  };

  return (
    <div className="w-full">
      {/* Hidden file input with capture="environment" to guarantee camera-only launch without photo gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Hidden canvas for video frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Trigger Button or Photo Preview Thumbnail */}
      {!photoPreview ? (
        <button
          type="button"
          onClick={openLiveCamera}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border-2 border-dashed border-slate-600 hover:border-slate-400 font-semibold text-sm transition-colors"
        >
          <Camera className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Chụp ảnh hiện trường sự cố (Bắt buộc Camera)</span>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-slate-900 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreview}
            alt="Hiện trường sự cố"
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-3">
            <span className="text-xs font-bold text-emerald-400 bg-slate-900/90 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-500/40">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã đính kèm ảnh
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openLiveCamera}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Chụp lại
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 border border-red-400"
              >
                <X className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Camera Header */}
          <div className="p-4 flex items-center justify-between bg-black/60 text-white z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              <span className="font-bold text-sm tracking-wide">CHỤP ẢNH HIỆN TRƯỜNG</span>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Feed */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guide Grid */}
            <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="text-white/40 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                Hướng camera vào hiện trường
              </div>
            </div>
          </div>

          {/* Shutter Controls */}
          <div className="p-6 bg-black/80 flex items-center justify-around z-10">
            <button
              type="button"
              onClick={handleCloseModal}
              className="text-slate-300 text-sm font-semibold px-4 py-2"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-20 h-20 rounded-full border-4 border-white bg-red-600 active:scale-95 flex items-center justify-center shadow-xl transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 border border-white/50"></div>
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                setIsLiveCameraOpen(false);
                fileInputRef.current?.click();
              }}
              className="text-slate-300 text-xs font-medium text-center"
            >
              <ImageIcon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              Chụp thường
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
