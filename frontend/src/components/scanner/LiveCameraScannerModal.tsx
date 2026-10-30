'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  Scan, 
  X, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Flashlight,
  FlipHorizontal,
  Volume2,
  QrCode,
  Barcode,
  ArrowLeft,
  ChevronRight,
  Sparkles
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

// Synthesize pleasant crisp success beep on scan
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
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio policy errors
  }
}

export type ScannerMode = 'select' | 'qr' | 'barcode';

export interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, rawText?: string) => void;
  title?: string;
  subtitle?: string;
  defaultMode?: ScannerMode;
}

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Job Card Scanner',
  subtitle = 'Scan Traveler QR Code or Barcode',
  defaultMode = 'select'
}) => {
  const [mode, setMode] = useState<ScannerMode>(defaultMode);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const scannerRef = useRef<any>(null);
  const isScanningActiveRef = useRef(false);
  const viewportId = useRef(`rf-scanner-${Math.random().toString(36).substring(2, 9)}`);

  // Handle successful detection
  const handleDecoded = useCallback((decodedText: string) => {
    if (!isScanningActiveRef.current) return;
    const clean = parseScannedJobCode(decodedText);
    if (!clean) return;

    isScanningActiveRef.current = false;
    setIsLocked(true);
    setDetectedCode(clean);

    playScanSuccessBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 40, 80]); } catch {}
    }

    // Short visual confirmation before closing
    setTimeout(() => {
      onScanSuccess(clean, decodedText);
      onClose();
    }, 450);
  }, [onScanSuccess, onClose]);

  // Clean stop scanner instance
  const stopScanner = useCallback(async () => {
    isScanningActiveRef.current = false;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop warning:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  // Reset mode when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setIsLocked(false);
      setDetectedCode(null);
      setErrorMessage(null);
      setIsTorchOn(false);
      setManualCode('');
    } else {
      stopScanner();
      setIsLocked(false);
      setDetectedCode(null);
      setErrorMessage(null);
      setIsTorchOn(false);
    }
  }, [isOpen, defaultMode, stopScanner]);

  // Start / restart camera whenever in 'qr' or 'barcode' mode
  useEffect(() => {
    if (!isOpen || mode === 'select') {
      stopScanner();
      return;
    }

    let isMounted = true;
    isScanningActiveRef.current = true;
    setIsStarting(true);
    setErrorMessage(null);
    setIsLocked(false);
    setDetectedCode(null);

    const initScanner = async () => {
      try {
        // Small delay to ensure Portal DOM viewport element is mounted
        await new Promise((r) => setTimeout(r, 80));
        if (!isMounted) return;

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!isMounted) return;

        const element = document.getElementById(viewportId.current);
        if (!element) {
          throw new Error('Scanner viewport container not found in DOM');
        }

        // Configure formats specific to user's selected mode
        const formatsToSupport = mode === 'qr'
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.UPC_A,
            ];

        const scanner = new Html5Qrcode(viewportId.current, {
          formatsToSupport,
          verbose: false,
        });

        scannerRef.current = scanner;

        // Optimized box for QR (square) vs Barcode (wide horizontal rectangle)
        const scanConfig = {
          fps: 22,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            if (mode === 'qr') {
              const edge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.max(200, Math.floor(edge * 0.72));
              return { width: size, height: size };
            } else {
              // Barcode format: Wide horizontal box
              const w = Math.min(viewfinderWidth * 0.88, 320);
              const h = Math.min(viewfinderHeight * 0.44, 130);
              return { width: Math.floor(w), height: Math.floor(h) };
            }
          },
          aspectRatio: mode === 'qr' ? 1.0 : 1.7777,
        };

        // Try environment camera first, then user camera
        try {
          await scanner.start(
            { facingMode: facingMode },
            scanConfig,
            (decodedText: string) => handleDecoded(decodedText),
            () => {}
          );
        } catch (camErr) {
          console.warn('FacingMode camera failed, trying fallback camera:', camErr);
          await scanner.start(
            { facingMode: facingMode === 'environment' ? 'user' : 'environment' },
            scanConfig,
            (decodedText: string) => handleDecoded(decodedText),
            () => {}
          );
        }

        if (isMounted) {
          setIsStarting(false);
          // Check torch capability
          try {
            const track = (scanner as any).getRunningTrackCameraCapabilities();
            setHasTorch(Boolean(track?.torchFeature()?.isSupported?.()));
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Camera Scanner start error:', err);
          setIsStarting(false);
          setErrorMessage(
            err?.message?.includes('Permission')
              ? 'Camera permission denied. Please allow camera access in browser settings.'
              : 'Unable to start camera. Please check camera connection or permissions.'
          );
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, mode, facingMode, handleDecoded, stopScanner]);

  // Torch / Flashlight toggle
  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle not supported', e);
    }
  };

  // Flip Camera (environment <-> user)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual fallback submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecoded(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        
        {/* Modal Dialog Container */}
        <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* =============================================================== */}
          {/* SCREEN 1: PRE-SCAN SELECTION (QR CODE OR BARCODE)                */}
          {/* =============================================================== */}
          {mode === 'select' && (
            <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
              
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Scan className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-mono tracking-wide">
                      {title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Choose code type to scan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selection Banner / Prompt */}
              <div className="text-center py-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  STEP 1 • CHOOSE SCANNER TYPE
                </span>
                <p className="text-xs text-slate-300 mt-2">
                  Select what is printed on your physical Job Traveler:
                </p>
              </div>

              {/* The 2 Large Touch Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* OPTION 1: QR CODE */}
                <button
                  type="button"
                  onClick={() => setMode('qr')}
                  className="group relative bg-gradient-to-br from-slate-900 to-slate-900/95 hover:from-blue-950/50 hover:to-slate-900 border-2 border-slate-700/80 hover:border-blue-500 rounded-2xl p-4 text-left transition-all cursor-pointer shadow-lg active:scale-[0.98] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      2D Square
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white font-mono group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>QR Code</span>
                      <span className="text-xs text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Scan 2D Square QR Code on traveler traveler sheet
                    </p>
                  </div>
                </button>

                {/* OPTION 2: BARCODE */}
                <button
                  type="button"
                  onClick={() => setMode('barcode')}
                  className="group relative bg-gradient-to-br from-slate-900 to-slate-900/95 hover:from-amber-950/50 hover:to-slate-900 border-2 border-slate-700/80 hover:border-amber-500 rounded-2xl p-4 text-left transition-all cursor-pointer shadow-lg active:scale-[0.98] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-sm">
                      <Barcode className="w-6 h-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      1D Linear
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white font-mono group-hover:text-amber-400 transition-colors flex items-center justify-between">
                      <span>Bar Code</span>
                      <span className="text-xs text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Scan horizontal 1D Code-128 or Code-39 barcode
                    </p>
                  </div>
                </button>

              </div>

              {/* Bottom Manual Entry Fallback */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Torn code or no camera?</span>
                  <span className="text-[10px] text-blue-400 font-bold">Manual Entry</span>
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter Job Card No (e.g. 26-27-2432)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Open Job
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* SCREEN 2: ACTIVE LIVE CAMERA VIEWFINDER (QR OR BARCODE)         */}
          {/* =============================================================== */}
          {mode !== 'select' && (
            <>
              {/* Top Control Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
                
                {/* Back to Options Button */}
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all border border-slate-700 active:scale-95"
                  title="Choose QR Code or Barcode"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Option</span>
                </button>

                {/* Current Active Mode Badge */}
                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                    mode === 'qr'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {mode === 'qr' ? (
                      <>
                        <QrCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>QR Code Mode</span>
                      </>
                    ) : (
                      <>
                        <Barcode className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bar Code Mode</span>
                      </>
                    )}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </div>

                {/* Right Action Icons (Torch, Flip, Close) */}
                <div className="flex items-center gap-1">
                  {/* Torch toggle */}
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isTorchOn 
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Toggle Flashlight"
                    >
                      <Flashlight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Camera flip */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all"
                    title="Switch Camera (Front/Back)"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all ml-0.5"
                    title="Close Scanner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Camera Viewport & HUD Overlay */}
              <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
                
                {/* Live WebRTC Camera Stream Container */}
                <div
                  id={viewportId.current}
                  className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                />

                {/* Starting Spinner */}
                {isStarting && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-3 z-10">
                    <RefreshCw className={`w-8 h-8 animate-spin ${mode === 'qr' ? 'text-blue-400' : 'text-amber-400'}`} />
                    <p className={`text-xs font-mono font-bold ${mode === 'qr' ? 'text-blue-300' : 'text-amber-300'}`}>
                      Activating {mode === 'qr' ? 'QR Code' : 'Bar Code'} Viewfinder...
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">Aligning sensor to code format</p>
                  </div>
                )}

                {/* Error Overlay */}
                {errorMessage && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <p className="text-xs font-bold text-rose-300">{errorMessage}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFacingMode((p) => (p === 'environment' ? 'user' : 'environment'))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                      >
                        Try Other Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('select')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Back to Options
                      </button>
                    </div>
                  </div>
                )}

                {/* High-Tech HUD Viewfinder Reticle */}
                {!isStarting && !errorMessage && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    
                    {/* Center Target Box: Square for QR, Horizontal Rectangle for Barcode */}
                    <div className={`relative transition-all duration-200 ${
                      mode === 'qr' 
                        ? 'w-64 h-64 sm:w-72 sm:h-72' 
                        : 'w-72 h-36 sm:w-80 sm:h-40'
                    } ${isLocked ? 'scale-105' : ''}`}>
                      
                      {/* Corner Target Brackets */}
                      <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-200 ${
                        isLocked 
                          ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' 
                          : mode === 'qr'
                            ? 'border-blue-400 shadow-[0_0_12px_#38bdf8]'
                            : 'border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      }`} />
                      <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-200 ${
                        isLocked 
                          ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' 
                          : mode === 'qr'
                            ? 'border-blue-400 shadow-[0_0_12px_#38bdf8]'
                            : 'border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      }`} />
                      <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-200 ${
                        isLocked 
                          ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' 
                          : mode === 'qr'
                            ? 'border-blue-400 shadow-[0_0_12px_#38bdf8]'
                            : 'border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      }`} />
                      <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-200 ${
                        isLocked 
                          ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' 
                          : mode === 'qr'
                            ? 'border-blue-400 shadow-[0_0_12px_#38bdf8]'
                            : 'border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      }`} />

                      {/* Animated Laser Scanning Beam */}
                      {!isLocked ? (
                        <div 
                          className={`absolute left-3 right-3 h-0.5 shadow-lg ${
                            mode === 'qr'
                              ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_#38bdf8]'
                              : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_#f59e0b]'
                          }`}
                          style={{
                            animation: 'rfLaserScan 2s ease-in-out infinite'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-0.5 w-full bg-emerald-400 shadow-[0_0_20px_#10b981]" />
                        </div>
                      )}

                      {/* Code Locked Success Banner */}
                      {isLocked && detectedCode && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl p-4 text-center space-y-2 animate-in zoom-in-95 duration-150">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                              CODE DETECTED
                            </span>
                            <span className="text-base font-black text-white font-mono tracking-tight block">
                              {detectedCode}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Subtitle / Tip Pill */}
                    {!isLocked && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-full border border-slate-700 text-[10.5px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'qr' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                        <span>
                          {mode === 'qr'
                            ? 'Align QR Code inside square frame'
                            : 'Align Barcode across the laser beam'}
                        </span>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Bottom Quick Switch & Manual Entry */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
                
                {/* 1-Tap Quick Switch between QR and Barcode without going back */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'qr' ? 'barcode' : 'qr')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-400" />
                    <span>Switch to {mode === 'qr' ? 'Bar Code' : 'QR Code'}</span>
                  </button>
                  <span className="text-[10.5px] text-slate-500 font-mono">Auto-decoding</span>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Or enter Job Card No manually..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    <span>Find</span>
                  </button>
                </form>

              </div>
            </>
          )}

        </div>

      </div>

      {/* Laser Scan Keyframe Animation CSS */}
      <style jsx global>{`
        @keyframes rfLaserScan {
          0% {
            top: 6%;
            opacity: 0.85;
          }
          50% {
            top: 90%;
            opacity: 1;
          }
          100% {
            top: 6%;
            opacity: 0.85;
          }
        }
      `}</style>
    </Portal>
  );
};
