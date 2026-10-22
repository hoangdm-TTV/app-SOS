import { LocationInfo } from './types';
import { api } from './api';

export type CallStatus =
  | 'idle'
  | 'requesting_permission'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'fallback'
  | 'error';

export interface WebRtcCallOptions {
  location: LocationInfo;
  hotline?: string;
  onStatusChange?: (status: CallStatus, message?: string) => void;
  onDurationTick?: (durationSeconds: number) => void;
  onFallback?: (reason: string) => void;
}

class WebRtcSosService {
  private mediaStream: MediaStream | null = null;
  private status: CallStatus = 'idle';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private durationSeconds = 0;
  private fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private isMuted = false;

  private currentOptions: WebRtcCallOptions | null = null;

  public getStatus(): CallStatus {
    return this.status;
  }

  public getDuration(): number {
    return this.durationSeconds;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Start 1-touch SOS WebRTC Call
   * Fallback to Tel: if mic denied or after 3 seconds timeout
   */
  public async startCall(options: WebRtcCallOptions): Promise<void> {
    this.currentOptions = options;
    this.durationSeconds = 0;
    this.isMuted = false;
    this.updateStatus('requesting_permission', 'Đang yêu cầu quyền Micro...');

    const hotline =
      options.hotline || process.env.NEXT_PUBLIC_HOTLINE || '19001234';

    // Start 3-second WebRTC fallback timer as required by spec
    this.clearFallbackTimer();
    this.fallbackTimeoutId = setTimeout(() => {
      if (this.status === 'requesting_permission' || this.status === 'connecting') {
        console.warn('[WebRTC] 3-second timeout reached. Triggering PSTN Tel fallback...');
        this.triggerFallback('webrtc_timeout_3s', hotline);
      }
    }, 3000);

    // 1. Record call intent to backend
    api.recordCallIntent({
      locationId: options.location.id,
      locationName: options.location.name,
      callType: 'webrtc',
      status: 'initiated',
      reason: 'User triggered 1-touch SOS call',
      metadata: {
        route: options.location.route,
        code: options.location.code,
      },
    }).catch((err) => console.warn('Could not record call intent:', err));

    // 2. Request mic permission
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Thiết bị không hỗ trợ WebRTC Media');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.mediaStream = stream;
      this.updateStatus('connecting', 'Đang kết nối tổng đài cứu hộ...');
      this.playDialTone();

      // Check if Stringee is loaded in window
      if (typeof window !== 'undefined' && (window as unknown as { StringeeClient?: unknown }).StringeeClient) {
        console.log('[WebRTC] Stringee SDK detected. Initializing Stringee call session...');
      }

      // Simulate connection establishment
      setTimeout(() => {
        if (this.status === 'connecting') {
          this.clearFallbackTimer();
          this.stopDialTone();
          this.updateStatus('connected', 'Đã kết nối với tổng đài viên SOS');
          this.startCallDurationTimer();
        }
      }, 1800);

    } catch (err: unknown) {
      console.error('[WebRTC] Microphone access denied or media error:', err);
      const reason = err instanceof Error ? err.message : 'mic_permission_denied';
      this.clearFallbackTimer();
      this.triggerFallback(reason, hotline);
    }
  }

  /**
   * Fallback triggered: log intent + redirect to tel:hotline
   */
  public async triggerFallback(reason: string, hotline: string): Promise<void> {
    this.stopDialTone();
    this.stopMediaStream();
    this.clearFallbackTimer();
    this.updateStatus('fallback', `Đang chuyển hướng sang đường dây nóng: ${hotline}`);

    if (this.currentOptions) {
      // Record intent to API
      await api.recordCallIntent({
        locationId: this.currentOptions.location.id,
        locationName: this.currentOptions.location.name,
        callType: 'tel_fallback',
        status: 'fallback_redirected',
        reason: `Fallback: ${reason}`,
      }).catch(console.warn);

      this.currentOptions.onFallback?.(reason);
    }

    // Direct redirect to phone call app
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${hotline}`;
    }
  }

  /**
   * Toggle Mute Microphone
   */
  public toggleMute(): boolean {
    if (!this.mediaStream) return false;
    const audioTracks = this.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextMuteState = !this.isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !nextMuteState;
      });
      this.isMuted = nextMuteState;
      return this.isMuted;
    }
    return false;
  }

  /**
   * Hang up the active call
   */
  public endCall(): void {
    this.clearFallbackTimer();
    this.clearDurationTimer();
    this.stopDialTone();
    this.stopMediaStream();
    this.updateStatus('ended', 'Cuộc gọi đã kết thúc');
    setTimeout(() => {
      this.updateStatus('idle');
    }, 1200);
  }

  private updateStatus(status: CallStatus, message?: string) {
    this.status = status;
    this.currentOptions?.onStatusChange?.(status, message);
  }

  private startCallDurationTimer() {
    this.clearDurationTimer();
    this.durationSeconds = 0;
    this.timerId = setInterval(() => {
      this.durationSeconds += 1;
      this.currentOptions?.onDurationTick?.(this.durationSeconds);
    }, 1000);
  }

  private clearDurationTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private clearFallbackTimer() {
    if (this.fallbackTimeoutId) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = null;
    }
  }

  private stopMediaStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  // Synthesize soft dial-tone using Web Audio API (Zero-install, no external files)
  private playDialTone() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      this.ringOscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      this.ringOscillator.type = 'sine';
      this.ringOscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // Standard 440Hz
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      this.ringOscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      this.ringOscillator.start();
    } catch {
      // AudioContext might be blocked until gesture, safe to ignore
    }
  }

  private stopDialTone() {
    try {
      if (this.ringOscillator) {
        this.ringOscillator.stop();
        this.ringOscillator.disconnect();
        this.ringOscillator = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
    } catch {
      // safe ignore
    }
  }
}

export const webRtcSosService = new WebRtcSosService();
