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
    // Check if there's a trailing timestamp suffix like -8921 on RFE-JC-26-27-3781-8921
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

interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, rawText: string) => void;
  title?: string;
  subtitle?: string;
}

type ScanMode = 'ALL' | 'QR' | 'BARCODE';

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Stage & Job Card Scanner',
  subtitle = 'Scan Physical Traveler Tag QR Code or 1D Barcode'
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('ALL');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const readerElementId = 'rf-qr-reader-viewport';

  // Handler for successful scan
  const handleSuccess = useCallback((decodedText: string) => {
    const cleanCode = parseScannedJobCode(decodedText);
    if (!cleanCode) return;

    playScanSuccessBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    setScannedResult(cleanCode);

    // Provide visual feedback then call parent callback and close
    setTimeout(() => {
      onScanSuccess(cleanCode, decodedText);
      onClose();
    }, 450);
  }, [onScanSuccess, onClose]);

  // Cleanly stop scanner instance
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner', e);
      } finally {
        isRunningRef.current = false;
      }
    }
  }, []);

  // Start scanner with specific camera / mode
  const startScanner = useCallback(async (modeToUse = scanMode, cameraIdToUse = selectedCameraId) => {
    if (typeof window === 'undefined') return;
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      await stopScanner();

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      let formatsToSupport: any[] = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
      ];

      if (modeToUse === 'QR') {
        formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE];
      } else if (modeToUse === 'BARCODE') {
        formatsToSupport = [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
        ];
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport,
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const cameraConfig = cameraIdToUse 
        ? { deviceId: { exact: cameraIdToUse } } 
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.85),
              height: modeToUse === 'BARCODE' ? Math.floor(minEdge * 0.45) : Math.floor(minEdge * 0.75),
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {}
      );

      isRunningRef.current = true;
      setHasCameraPermission(true);
      setIsInitializing(false);

      // Enumerate available cameras once stream is live
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch {}

    } catch (err: any) {
      console.warn('Live scanner initialization error:', err);
      isRunningRef.current = false;
      setHasCameraPermission(false);
      setErrorMessage(err?.message || 'Camera permission was not granted by your browser.');
      setIsInitializing(false);
    }
  }, [scanMode, selectedCameraId, handleSuccess, stopScanner]);

  // Mode change handler (switch between Auto, QR, Barcode)
  const handleModeChange = (newMode: ScanMode) => {
    setScanMode(newMode);
    if (isRunningRef.current) {
      startScanner(newMode, selectedCameraId);
    }
  };

  // Explicit permission request triggered by user button tap
  const handleRequestPermission = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
        stream.getTracks().forEach((t) => t.stop());
      }
      await startScanner(scanMode, selectedCameraId);
    } catch (err: any) {
      setHasCameraPermission(false);
      setErrorMessage(err?.message || 'Camera access was denied in browser settings.');
      setIsInitializing(false);
    }
  };

  // File Upload / Instant Camera Snapshot Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      let localQr = scannerRef.current;
      if (!localQr) {
        localQr = new Html5Qrcode(readerElementId, { verbose: false });
        scannerRef.current = localQr;
      }

      const decodedText = await localQr.scanFile(file, true);
      if (decodedText) {
        handleSuccess(decodedText);
      }
    } catch (err: any) {
      console.warn('File decode error', err);
      alert('No QR Code or Barcode detected in this photo. Please ensure the code is well-lit and in clear focus.');
    } finally {
      setIsScanningFile(false);
    }
  };

  // Modal open/close lifecycle (Runs only when isOpen changes to prevent flickering)
  useEffect(() => {
    let timer: any = null;
    if (isOpen) {
      setScannedResult(null);
      timer = setTimeout(() => {
        startScanner(scanMode);
      }, 120);
    } else {
      stopScanner();
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]); // Only depend on isOpen to avoid constant flicker

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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
        
        {/* Main Clean Modal Container */}
        <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] font-sans text-slate-900">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0">
                <Scan className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                    {title}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {subtitle}
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

          {/* Mode Selector Tabs (Theme Clean) */}
          <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
              
              <button
                type="button"
                onClick={() => handleModeChange('ALL')}
                className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span className="truncate">Auto (Both)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('QR')}
                className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'QR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="truncate">QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('BARCODE')}
                className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'BARCODE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span className="truncate">Barcode 1D</span>
              </button>

            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="p-4 bg-slate-50/50 flex-1 flex flex-col items-center justify-center min-h-[290px]">
            
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-square flex items-center justify-center shadow-inner border border-slate-800">
              
              {/* Video Element */}
              <div 
                id={readerElementId} 
                className="w-full h-full flex items-center justify-center overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* Viewfinder Target Guidelines */}
              {!scannedResult && hasCameraPermission === true && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className={`relative border-2 border-dashed ${
                    scanMode === 'BARCODE' 
                      ? 'w-72 sm:w-80 h-28 border-amber-400' 
                      : 'w-56 sm:w-64 h-56 sm:h-64 border-blue-400'
                  } rounded-2xl transition-all duration-200 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]`}>
                    
                    {/* Corner Guides */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                    {/* Scanning Beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />
                    
                    <div className="absolute -bottom-6 inset-x-0 text-center">
                      <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700 shadow-sm whitespace-nowrap">
                        Align {scanMode === 'BARCODE' ? 'Barcode' : scanMode === 'QR' ? 'QR Code' : 'QR / Barcode'} inside box
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

              {/* Camera Permission Required View */}
              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
                  
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="max-w-xs space-y-1">
                    <h4 className="font-extrabold text-white text-sm">Camera Permission Needed</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tap below to take a photo directly or allow live video in your browser.
                    </p>
                  </div>

                  {/* Direct Native Photo Snapshot Button */}
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
                      onClick={handleRequestPermission}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Enable Live Camera Stream</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-950/90 p-2 rounded-xl border border-slate-800 text-left max-w-xs">
                    <p className="text-slate-300 font-bold mb-0.5">💡 To allow in Chrome / Safari:</p>
                    <p>Tap <strong>🔒 Lock / Settings icon</strong> in URL bar ➔ <strong>Camera ➔ Allow</strong>.</p>
                  </div>

                </div>
              )}

              {/* Initializing Spinner */}
              {isInitializing && (
                <div className="absolute top-3 right-3 z-10 bg-slate-900/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                  <span>Starting...</span>
                </div>
              )}

              {/* Scanning Image File Indicator */}
              {isScanningFile && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-center p-4">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mb-2" />
                  <p className="text-xs font-bold text-white">Scanning photo for Job Card Code...</p>
                </div>
              )}

            </div>

          </div>

          {/* Quick Actions Strip (Native Camera Snapshot & Gallery Upload) */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
            
            {/* Quick Camera Snapshot Button */}
            <label className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>📸 Quick Snap</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Switch Camera if multiple cameras available */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCamera = cameras[nextIndex];
                  setSelectedCameraId(nextCamera.id);
                  startScanner(scanMode, nextCamera.id);
                }}
                className="py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span>Switch ({cameras.length})</span>
              </button>
            )}

            {/* Choose from Gallery */}
            <label className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ml-auto">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

          </div>

          {/* Bottom Manual Search Form */}
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>Find & Move</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </Portal>
  );
};
