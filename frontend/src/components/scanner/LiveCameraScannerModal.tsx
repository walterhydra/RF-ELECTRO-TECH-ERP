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
  Maximize2,
  Lock,
  ArrowRight
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
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
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
  title = 'Shop Floor Mobile Scanner',
  subtitle = 'Scan printed Physical Job Card QR Code or 1D Barcode'
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('ALL');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const readerElementId = 'html5qr-code-video-reader';

  // Handler for successful scan
  const handleSuccess = useCallback((decodedText: string) => {
    const cleanCode = parseScannedJobCode(decodedText);
    if (!cleanCode) return;

    playScanSuccessBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    setScannedResult(cleanCode);

    // Give visual confirmation for 400ms then call parent callback and close
    setTimeout(() => {
      onScanSuccess(cleanCode, decodedText);
      onClose();
    }, 450);
  }, [onScanSuccess, onClose]);

  // Request media stream directly (triggers native browser permission dialog)
  const requestCameraPermissionAndStart = useCallback(async (cameraIdToUse?: string) => {
    if (typeof window === 'undefined') return;
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Stop previous instance if running
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Stopping previous scanner instance:', e);
        }
      }

      // Configure formats based on scanMode
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

      if (scanMode === 'QR') {
        formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE];
      } else if (scanMode === 'BARCODE') {
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

      // Direct camera config (environment = back camera on mobile phones)
      const cameraConfig = cameraIdToUse
        ? { deviceId: { exact: cameraIdToUse } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 18,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.88),
              height: scanMode === 'BARCODE' ? Math.floor(minEdge * 0.45) : Math.floor(minEdge * 0.75),
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Frame search ongoing
        }
      );

      setHasCameraPermission(true);
      setIsScanningActive(true);
      setIsInitializing(false);

      // Populate camera devices after stream has started
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch {}

    } catch (err: any) {
      console.warn('Primary camera stream start failed:', err);

      // Fallback: Try with basic video constraints
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
          testStream.getTracks().forEach((track) => track.stop());
          setHasCameraPermission(true);
          
          // Re-attempt html5QrCode start with simple constraints
          if (scannerRef.current) {
            await scannerRef.current.start(
              { facingMode: 'environment' },
              { fps: 15, qrbox: 260 },
              (decodedText: string) => handleSuccess(decodedText),
              () => {}
            );
            setIsScanningActive(true);
            setIsInitializing(false);
            return;
          }
        }
      } catch (fallbackErr: any) {
        console.error('Fallback camera permission failed:', fallbackErr);
      }

      setHasCameraPermission(false);
      setIsScanningActive(false);
      setErrorMessage(
        err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
          ? 'Camera permission is blocked in your browser. Please tap the lock/settings icon in the address bar to allow camera access, or use "Take Photo with Phone Camera" below.'
          : (err?.message || 'Could not access camera. Please check browser permissions or use the Photo Snapshot button.')
      );
      setIsInitializing(false);
    }
  }, [scanMode, handleSuccess]);

  // Handle Modal Open / Close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      const timer = setTimeout(() => {
        requestCameraPermissionAndStart();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Cleanup error', e);
        }
      }
      setIsScanningActive(false);
    }
  }, [isOpen, scanMode, requestCameraPermissionAndStart]);

  // Handle Photo File Upload / Snapshot (Works 100% on any mobile device without live stream permission)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsInitializing(true);
      const { Html5Qrcode } = await import('html5-qrcode');
      
      let tempScanner = scannerRef.current;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode(readerElementId, { verbose: false });
        scannerRef.current = tempScanner;
      }

      const decodedText = await tempScanner.scanFile(file, true);
      if (decodedText) {
        handleSuccess(decodedText);
      }
    } catch (err: any) {
      setErrorMessage('Could not decode a valid QR Code or Barcode from this photo. Please make sure the barcode or QR code is well-lit and in focus.');
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const clean = parseScannedJobCode(manualInput.trim());
    handleSuccess(clean);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* 1. Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Scan className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                  <span>{title}</span>
                  {isScanningActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Mode Switcher Tabs */}
          <div className="px-5 pt-3 pb-2 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              
              <button
                type="button"
                onClick={() => setScanMode('ALL')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>Auto (All)</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('QR')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'QR'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Only</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('BARCODE')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'BARCODE'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Barcode Only</span>
              </button>

            </div>
          </div>

          {/* 3. Camera Viewfinder / Scanner Feed */}
          <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[290px] overflow-hidden">
            
            {/* HTML5 QR Code Container */}
            <div 
              id={readerElementId} 
              className="w-full h-full min-h-[290px] flex items-center justify-center overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Target Laser Viewfinder Overlay */}
            {!scannedResult && hasCameraPermission !== false && isScanningActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className={`relative border-2 border-dashed ${
                  scanMode === 'BARCODE' 
                    ? 'w-72 sm:w-80 h-28 border-amber-400' 
                    : 'w-64 sm:w-72 h-64 sm:h-72 border-blue-400'
                } rounded-3xl transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]`}>
                  
                  {/* Corner Targets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

                  {/* Laser Scan Beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                  
                  <div className="absolute -bottom-7 inset-x-0 text-center">
                    <span className="text-[11px] font-bold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700 shadow-md">
                      Align {scanMode === 'BARCODE' ? 'Barcode' : scanMode === 'QR' ? 'QR Code' : 'QR / Barcode'} within box
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Success Animation Overlay */}
            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 z-20">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-3 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h4 className="text-2xl font-black text-white font-mono tracking-tight">
                  {scannedResult}
                </h4>
                <p className="text-xs font-bold text-emerald-300 mt-1">
                  Job Card Detected! Loading shop floor details...
                </p>
              </div>
            )}

            {/* Permission Denied or Camera Error State */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center space-y-4 z-10 overflow-y-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                
                <div className="max-w-xs space-y-1.5">
                  <h4 className="font-extrabold text-white text-base">Grant Camera Access</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {errorMessage || 'Tap Allow when your phone browser asks for camera permission.'}
                  </p>
                </div>

                {/* Primary Action 1: Native Phone Camera Snapshot (Always Works 100%) */}
                <div className="w-full max-w-xs space-y-2.5 pt-1">
                  
                  <label
                    htmlFor="nativeCameraSnapshotInput"
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-center border border-blue-400/30"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>📸 Take Photo with Phone Camera</span>
                    <input
                      type="file"
                      id="nativeCameraSnapshotInput"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => requestCameraPermissionAndStart()}
                      className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Retry Permission</span>
                    </button>

                    <label
                      htmlFor="galleryPhotoFileInput"
                      className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 text-center"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Photo</span>
                      <input
                        type="file"
                        id="galleryPhotoFileInput"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Browser Permission Tip */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-left text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>How to unblock camera in Chrome:</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tap the lock 🔒 or site settings icon in the address bar at the top → Permissions → Set Camera to <b>Allow</b>.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Initializing Spinner */}
            {isInitializing && (
              <div className="absolute top-4 right-4 z-10 bg-slate-900/80 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Starting camera...</span>
              </div>
            )}
          </div>

          {/* 4. Native Phone Snapshot & Gallery Options Strip */}
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            
            {/* Native Mobile Camera Snap Input */}
            <label
              htmlFor="nativeMobileCameraInput"
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 active:scale-95 shadow-sm"
              title="Snap photo with native phone camera"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Take Camera Photo</span>
              <input
                type="file"
                id="nativeMobileCameraInput"
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
                  const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCamera = cameras[nextIndex];
                  setSelectedCameraId(nextCamera.id);
                  requestCameraPermissionAndStart(nextCamera.id);
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Flip ({cameras.length})</span>
              </button>
            )}

            <label
              htmlFor="galleryUploadInput"
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 ml-auto"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gallery</span>
              <input
                type="file"
                id="galleryUploadInput"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 5. Bottom Manual Entry Fallback */}
          <div className="p-4 bg-slate-900 border-t border-slate-800/80 shrink-0">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Or type Job Card No. (e.g. 26-27-3781)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Find</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </Portal>
  );
};
