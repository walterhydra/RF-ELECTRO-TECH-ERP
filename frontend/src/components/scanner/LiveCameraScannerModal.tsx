'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  Scan, 
  X, 
  Zap, 
  QrCode, 
  Barcode, 
  RefreshCw, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  Lock,
  ArrowLeft,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';

// Smart Job Card & Sub Job Card Parser
export function parseScannedJobCode(rawText: string): string {
  if (!rawText) return '';
  let clean = rawText.trim();

  // 1. If wrapped in asterisks (e.g. *26-27-3781* from barcode)
  if (clean.startsWith('*') && clean.endsWith('*') && clean.length > 2) {
    clean = clean.slice(1, -1).trim();
  }

  // 2. If it contains "JOB CARD NO:" or "JOB NO:"
  const jcMatch = clean.match(/JOB\s*(?:CARD\s*)?NO\s*:\s*([A-Za-z0-9\-_]+)/i);
  if (jcMatch && jcMatch[1]) {
    return jcMatch[1].trim();
  }

  // 3. If it starts with RFE-JC- or RFE-SJC-
  const rfeMatch = clean.match(/^RFE-(?:JC|SJC)-([A-Za-z0-9\-_]+)/i);
  if (rfeMatch && rfeMatch[1]) {
    const rawCode = rfeMatch[1].trim();
    const strippedSuffix = rawCode.match(/^(\d{2}-\d{2}-\d+(?:-[A-Za-z0-9]+)?)-\d{4}$/);
    if (strippedSuffix && strippedSuffix[1]) {
      return strippedSuffix[1];
    }
    return rawCode;
  }

  // 4. If it is a URL with job card in path
  const urlMatch = clean.match(/\/job-cards(?:-pdf)?\/([A-Za-z0-9\-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }

  // 5. If JSON
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed.jobCardNo) return String(parsed.jobCardNo).trim();
      if (parsed.subJobCardNo) return String(parsed.subJobCardNo).trim();
      if (parsed.id) return String(parsed.id).trim();
    } catch {}
  }

  // 6. Look for typical Job Card number pattern e.g. 26-27-1234 or 26-27-1234-A or 26-27-1234-1
  const standardPattern = clean.match(/\b\d{2}-\d{2}-\d+(?:-[A-Za-z0-9]+)?\b/);
  if (standardPattern && standardPattern[0]) {
    return standardPattern[0].trim();
  }

  return clean;
}

// Synthesize pleasant success beep on scan
export function playScanSuccessBeep() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Ignore audio policy errors
  }
}

// High performance image decoder (native BarcodeDetector + Canvas multi-pass fallback)
async function decodeImageFile(file: File): Promise<string> {
  // 1. Try Native Browser BarcodeDetector (Chrome Android / Safari iOS 17+)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a', 'itf']
      });
      const bitmap = await createImageBitmap(file);
      const barcodes = await detector.detect(bitmap);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch (e) {
      console.warn('Native BarcodeDetector pass skipped', e);
    }
  }

  // 2. Fallback: Optimize image to 1000px on Canvas then pass to html5-qrcode
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const maxDim = 1000;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context error'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Blob conversion failed'));
              return;
            }
            try {
              const { Html5Qrcode } = await import('html5-qrcode');
              const tempReader = new Html5Qrcode('rf-qr-reader-viewport', { verbose: false });
              const optimizedFile = new File([blob], 'scan_optimized.jpg', { type: 'image/jpeg' });
              const result = await tempReader.scanFile(optimizedFile, true);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          }, 'image/jpeg', 0.90);

        } catch (canvasErr) {
          reject(canvasErr);
        }
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, rawText: string) => void;
  title?: string;
  subtitle?: string;
}

type ScanMode = 'QR' | 'BARCODE';

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Job Card',
  subtitle = 'Choose scanning mode to open camera'
}) => {
  // Step 1: Mode Selection (QR vs Barcode) | Step 2: Live Scanner Active
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef(false);

  // Handler for successful scan
  const handleSuccess = useCallback((decodedText: string) => {
    const cleanCode = parseScannedJobCode(decodedText);
    if (!cleanCode) return;

    playScanSuccessBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    setScannedResult(cleanCode);

    // Stop scanning loop
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Provide visual confirmation then call parent callback and close
    setTimeout(() => {
      onScanSuccess(cleanCode, decodedText);
      onClose();
    }, 450);
  }, [onScanSuccess, onClose]);

  // Cleanly stop video tracks
  const stopLiveCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Continuous frame analysis engine using Native BarcodeDetector or Canvas Decoder
  const startFrameAnalysis = useCallback((mode: ScanMode) => {
    if (!videoRef.current) return;
    isScanningActiveRef.current = true;

    // Check Native BarcodeDetector
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let nativeDetector: any = null;

    if (hasBarcodeDetector) {
      try {
        const formats = mode === 'QR' 
          ? ['qr_code'] 
          : ['code_128', 'code_39', 'ean_13', 'upc_a', 'itf'];
        nativeDetector = new (window as any).BarcodeDetector({ formats });
      } catch (e) {
        console.warn('Native BarcodeDetector init failed', e);
      }
    }

    // Hidden canvas for fallback frame capture
    const hiddenCanvas = document.createElement('canvas');
    const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

    let lastScanTime = 0;

    const analyzeFrame = async (timestamp: number) => {
      if (!isScanningActiveRef.current || !videoRef.current) return;

      // Throttle scanning to every 120ms (approx 8-10fps) for battery efficiency
      if (timestamp - lastScanTime > 120 && videoRef.current.readyState >= 2) {
        lastScanTime = timestamp;
        const video = videoRef.current;

        try {
          // 1. Try Native BarcodeDetector
          if (nativeDetector) {
            const detected = await nativeDetector.detect(video);
            if (detected && detected.length > 0 && detected[0].rawValue) {
              handleSuccess(detected[0].rawValue);
              return;
            }
          } else {
            // 2. HTML5 Qrcode fallback via canvas
            if (video.videoWidth > 0 && video.videoHeight > 0 && hiddenCtx) {
              hiddenCanvas.width = video.videoWidth;
              hiddenCanvas.height = video.videoHeight;
              hiddenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              
              hiddenCanvas.toBlob(async (blob) => {
                if (blob && isScanningActiveRef.current) {
                  try {
                    const { Html5Qrcode } = await import('html5-qrcode');
                    const tempReader = new Html5Qrcode('rf-qr-reader-viewport', { verbose: false });
                    const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                    const res = await tempReader.scanFile(file, false);
                    if (res && isScanningActiveRef.current) {
                      handleSuccess(res);
                    }
                  } catch {}
                }
              }, 'image/jpeg', 0.85);
            }
          }
        } catch (scanErr) {
          // Frame tick error ignored
        }
      }

      if (isScanningActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [handleSuccess]);

  // Start direct camera stream from user click (prompts browser permission immediately)
  const startLiveCamera = useCallback(async (mode: ScanMode, deviceId?: string) => {
    setIsInitializing(true);
    setErrorMessage(null);
    stopLiveCameraStream();

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { 
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);
      setIsInitializing(false);

      // Start frame scanning loop
      startFrameAnalysis(mode);

      // Query cameras for switcher
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        if (videoDevices.length > 0) {
          setCameras(videoDevices);
        }
      } catch {}

    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setHasCameraPermission(false);
      setErrorMessage(err?.message || 'Camera permission was denied. Please allow camera access in your browser.');
      setIsInitializing(false);
    }
  }, [stopLiveCameraStream, startFrameAnalysis]);

  // Direct user click on QR or Barcode option
  const handleSelectOption = (mode: ScanMode) => {
    setSelectedMode(mode);
    setScannedResult(null);
    setHasCameraPermission(null);
    
    // Directly request camera stream in this user-click event turn!
    startLiveCamera(mode);
  };

  // Back button to return to 2-option selector
  const handleBackToOptions = () => {
    stopLiveCameraStream();
    setSelectedMode(null);
    setHasCameraPermission(null);
    setErrorMessage(null);
    setScannedResult(null);
  };

  // File Upload / Instant Camera Snapshot Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    try {
      const decodedText = await decodeImageFile(file);
      if (decodedText) {
        handleSuccess(decodedText);
      }
    } catch (err: any) {
      console.warn('Image decode error', err);
      alert('Could not detect a clear code in this photo. Please make sure the code is well-lit and in focus.');
    } finally {
      setIsScanningFile(false);
    }
  };

  // Modal open/close lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopLiveCameraStream();
      setSelectedMode(null);
      setScannedResult(null);
    }
  }, [isOpen, stopLiveCameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveCameraStream();
    };
  }, [stopLiveCameraStream]);

  // Manual search submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const clean = parseScannedJobCode(manualInput.trim());
    handleSuccess(clean);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans text-slate-900">
        
        {/* Hidden Container for fallback html5-qrcode file decoding */}
        <div id="rf-qr-reader-viewport" className="hidden" />

        {/* Main Modal Box */}
        <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50/90 border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-3">
              {selectedMode ? (
                <button
                  type="button"
                  onClick={handleBackToOptions}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  title="Back to options"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0">
                  <Scan className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate">
                    {selectedMode === 'QR' ? '📱 QR Code Scanner' : selectedMode === 'BARCODE' ? '🏷️ Barcode Scanner' : 'Select Scan Option'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {selectedMode === 'QR' 
                    ? 'Point camera at Traveler Tag QR code' 
                    : selectedMode === 'BARCODE' 
                    ? 'Point camera at printed 1D Barcode' 
                    : 'Choose your scan method below'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* SCREEN 1: 2-OPTION SELECTION SCREEN (Clean & Simple) */}
          {!selectedMode ? (
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Option 1: QR Code Scanner */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('QR')}
                  className="group relative p-5 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 hover:to-blue-100/50 border-2 border-blue-200/90 hover:border-blue-500 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                      <QrCode className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                      2D QR
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">
                      QR Code Scan
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Scan printed Traveler Tag QR code to fetch live specs & stage.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Open Camera</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Option 2: Barcode Scanner */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('BARCODE')}
                  className="group relative p-5 bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/30 hover:to-indigo-100/50 border-2 border-indigo-200/90 hover:border-indigo-500 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                      <Barcode className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                      1D Code-128
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                      Barcode Scan
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Scan 1D barcode strip on Job Card (e.g. *26-27-3781*).
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    <span>Open Camera</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

              </div>

              {/* Direct Photo Capture & Manual Search Box */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>📸 Snap Photo with Mobile Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Manual Job No Search */}
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Or enter Job Card No. (e.g. 26-27-3781)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                    <span>Find</span>
                  </button>
                </form>

              </div>

            </div>
          ) : (
            /* SCREEN 2: ACTIVE LIVE WEBRTC CAMERA SCANNER */
            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 space-y-3">
              
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-square flex items-center justify-center shadow-inner border border-slate-800">
                
                {/* Native HTML5 Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target Guidelines Overlay */}
                {!scannedResult && hasCameraPermission === true && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className={`relative border-2 border-dashed ${
                      selectedMode === 'BARCODE' 
                        ? 'w-72 sm:w-80 h-28 border-amber-400' 
                        : 'w-56 sm:w-64 h-56 sm:h-64 border-blue-400'
                    } rounded-2xl transition-all duration-200 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]`}>
                      
                      {/* Corner Guides */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                      {/* Laser Beam */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />
                      
                      <div className="absolute -bottom-6 inset-x-0 text-center">
                        <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700 shadow-sm whitespace-nowrap">
                          Align {selectedMode === 'BARCODE' ? 'Barcode' : 'QR Code'} inside box
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scan Success Animation */}
                {scannedResult && (
                  <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150 z-20">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2.5 animate-bounce">
                      <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                    </div>
                    <h4 className="text-xl font-black text-white font-mono tracking-tight">
                      {scannedResult}
                    </h4>
                    <p className="text-xs font-bold text-emerald-300 mt-1">
                      Job Card Detected! Fetching Live Database Details...
                    </p>
                  </div>
                )}

                {/* Camera Permission Screen Fallback */}
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
                    
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="max-w-xs space-y-1">
                      <h4 className="font-extrabold text-white text-sm">Camera Permission Needed</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Tap below to take a photo directly or allow live video stream.
                      </p>
                    </div>

                    <div className="w-full max-w-xs space-y-2 pt-1">
                      <label className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all">
                        <Camera className="w-4 h-4 text-white" />
                        <span>📸 Snap Photo with Mobile Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => selectedMode && startLiveCamera(selectedMode)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Enable Live Camera Stream</span>
                      </button>
                    </div>

                  </div>
                )}

                {/* Initializing Spinner */}
                {isInitializing && (
                  <div className="absolute top-3 right-3 z-10 bg-slate-900/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                    <span>Starting camera...</span>
                  </div>
                )}

                {/* Decoding File Indicator */}
                {isScanningFile && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-center p-4">
                    <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mb-2" />
                    <p className="text-xs font-bold text-white">Analyzing photo for Job Card...</p>
                  </div>
                )}

              </div>

              {/* Bottom Action Strip */}
              <div className="flex items-center justify-between gap-2 pt-1">
                
                <button
                  type="button"
                  onClick={handleBackToOptions}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Switch Mode</span>
                </button>

                <label className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📸 Snap Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
                      const nextIndex = (currentIndex + 1) % cameras.length;
                      const nextCamera = cameras[nextIndex];
                      setSelectedCameraId(nextCamera.deviceId);
                      if (selectedMode) startLiveCamera(selectedMode, nextCamera.deviceId);
                    }}
                    className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                    <span>Flip</span>
                  </button>
                )}

              </div>

            </div>
          )}

        </div>

      </div>
    </Portal>
  );
};
