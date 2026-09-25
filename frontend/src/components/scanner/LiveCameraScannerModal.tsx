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
  ShieldCheck,
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
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

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

    // Give visual confirmation for 450ms then call parent callback and close
    setTimeout(() => {
      onScanSuccess(cleanCode, decodedText);
      onClose();
    }, 450);
  }, [onScanSuccess, onClose]);

  // Start / restart scanner instance
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    if (typeof window === 'undefined') return;
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // If existing scanner is active, stop and clear first
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Stopping previous scanner instance', e);
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

      // Start directly with environment camera facing mode (mobile back camera)
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
          // Frame search tick
        }
      );

      setHasCameraPermission(true);
      setIsInitializing(false);

      // Once camera stream is successfully active, enumerate devices for switcher
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch {}

    } catch (err: any) {
      console.warn('Camera start error:', err);
      setHasCameraPermission(false);
      setErrorMessage(err?.message || 'Camera access was not granted by browser or phone settings.');
      setIsInitializing(false);
    }
  }, [scanMode, handleSuccess]);

  // Explicit user permission request triggered by button click
  const handleRequestPermission = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
        // Release test stream
        stream.getTracks().forEach((t) => t.stop());
      }
      await startScanner();
    } catch (err: any) {
      setHasCameraPermission(false);
      setErrorMessage(err?.message || 'Camera permission was denied. Please allow camera access in your browser settings.');
      setIsInitializing(false);
    }
  };

  // Handle Modal Open / Close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
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
    }
  }, [isOpen, scanMode, startScanner]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch {}
      }
    };
  }, []);

  // Handle Photo File Upload / Camera Snapshot
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
      alert('Could not detect a clear QR Code or Barcode in this photo. Please make sure the barcode/QR is well-lit and in focus, or try scanning live.');
    } finally {
      setIsScanningFile(false);
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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
        
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Scan className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                  <span>{title}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[230px] sm:max-w-xs">
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

          {/* Mode Switcher Tabs */}
          <div className="px-4 pt-3 pb-2 bg-slate-900 border-b border-slate-800/80 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              
              <button
                type="button"
                onClick={() => setScanMode('ALL')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span className="truncate">Auto (Both)</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('QR')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'QR'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="truncate">QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('BARCODE')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'BARCODE'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span className="truncate">Barcode 1D</span>
              </button>

            </div>
          </div>

          {/* Camera Viewfinder & Scanner Body */}
          <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[290px] overflow-hidden">
            
            {/* HTML5 QR Code Container */}
            <div 
              id={readerElementId} 
              className="w-full h-full min-h-[290px] flex items-center justify-center overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Target Laser Viewfinder Overlay */}
            {!scannedResult && hasCameraPermission === true && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className={`relative border-2 border-dashed ${
                  scanMode === 'BARCODE' 
                    ? 'w-72 sm:w-80 h-28 border-amber-400' 
                    : 'w-60 sm:w-72 h-60 sm:h-72 border-blue-400'
                } rounded-3xl transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]`}>
                  
                  {/* Corner Targets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

                  {/* Laser Scan Beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                  
                  <div className="absolute -bottom-7 inset-x-0 text-center">
                    <span className="text-[11px] font-bold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700 shadow-md whitespace-nowrap">
                      Align {scanMode === 'BARCODE' ? 'Barcode' : scanMode === 'QR' ? 'QR Code' : 'QR / Barcode'} inside
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
                  Job Card Detected! Opening shop floor details...
                </p>
              </div>
            )}

            {/* Permission Denied or Camera Help State */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-900 p-5 flex flex-col items-center justify-center text-center space-y-3.5 z-10 overflow-y-auto">
                
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6 animate-pulse" />
                </div>

                <div className="max-w-xs space-y-1">
                  <h4 className="font-black text-white text-sm">Allow Camera Access</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tap the button below or allow camera in browser when prompted.
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
                  
                  {/* Native Phone Camera Snapshot Button (100% Reliable without permissions) */}
                  <label className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95 transition-all">
                    <Camera className="w-4 h-4 text-white" />
                    <span>📸 Snap Photo with Phone Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Browser Live Stream Request */}
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Enable Live Video Scanner</span>
                  </button>

                  {/* Gallery Pick */}
                  <label className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choose from Photo Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Help Note for Chrome/Safari */}
                <div className="text-[10px] text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-left max-w-xs space-y-1">
                  <div className="flex items-center gap-1 text-slate-300 font-bold">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>How to enable in Browser:</span>
                  </div>
                  <p>1. Tap the <strong>🔒 lock / tune icon</strong> in address bar next to URL.</p>
                  <p>2. Tap <strong>Permissions ➔ Camera ➔ Allow</strong>.</p>
                </div>

              </div>
            )}

            {/* Initializing Spinner */}
            {isInitializing && (
              <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Starting camera...</span>
              </div>
            )}

            {/* Scanning File Overlay */}
            {isScanningFile && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-4">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white">Analyzing photo for QR / Barcode...</p>
              </div>
            )}
          </div>

          {/* Action Toolbar: Native Camera Capture & Gallery */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            
            {/* Quick Snap with Phone Camera */}
            <label className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>📸 Quick Snap</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Camera Switcher if multiple video inputs */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCamera = cameras[nextIndex];
                  setSelectedCameraId(nextCamera.id);
                  startScanner(nextCamera.id);
                }}
                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3 h-3 text-blue-400" />
                <span>Switch ({cameras.length})</span>
              </button>
            )}

            {/* Gallery Upload */}
            <label className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 ml-auto">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Bottom Manual Search Fallback */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800/80 shrink-0">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Or enter Job No. (e.g. 26-27-3781)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Open</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </Portal>
  );
};
