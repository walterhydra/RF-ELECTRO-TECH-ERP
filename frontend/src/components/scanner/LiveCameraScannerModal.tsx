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
  ArrowLeft
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
  title = 'Select Scanner',
  subtitle,
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

  // Stable refs for callbacks so parent re-renders NEVER cause scanner to blink or restart
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const scannerRef = useRef<any>(null);
  const isScanningActiveRef = useRef(false);
  const isStoppingRef = useRef(false);
  const prevIsOpenRef = useRef(false);
  const viewportId = useRef('rf-live-camera-feed-viewport');

  // Clean stop scanner instance
  const stopScanner = useCallback(async () => {
    isScanningActiveRef.current = false;
    if (isStoppingRef.current) return;
    if (scannerRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop warning:', e);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
      }
    }
  }, []);

  // Handle successful detection (Stable callback, reads refs directly)
  const handleDecoded = useCallback((decodedText: string) => {
    if (!isScanningActiveRef.current) return;
    const clean = parseScannedJobCode(decodedText);
    if (!clean) return;

    isScanningActiveRef.current = false;
    setIsLocked(true);
    setDetectedCode(clean);

    // Pause camera video frame immediately so user sees the locked code without screen tearing
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause(true);
      }
    } catch {}

    playScanSuccessBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 40, 80]); } catch {}
    }

    // Short visual confirmation before closing
    setTimeout(() => {
      onScanSuccessRef.current(clean, decodedText);
      onCloseRef.current();
    }, 450);
  }, []);

  const handleDecodedRef = useRef(handleDecoded);
  handleDecodedRef.current = handleDecoded;

  // Modal open/close lifecycle - ONLY triggers on state changes (not parent polling re-renders)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Fresh modal open: reset state to initial mode
      setMode(defaultMode);
      setIsLocked(false);
      setDetectedCode(null);
      setErrorMessage(null);
      setIsTorchOn(false);
    } else if (!isOpen && prevIsOpenRef.current) {
      // Modal closed: clean up scanner
      stopScanner();
      setIsLocked(false);
      setDetectedCode(null);
      setErrorMessage(null);
      setIsTorchOn(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, defaultMode, stopScanner]);

  // Start camera ONLY when isOpen is true and mode is 'qr' or 'barcode'
  // NOTICE: Effect ONLY depends on [isOpen, mode, facingMode] - ZERO callback references
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
        await new Promise((r) => setTimeout(r, 100));
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

        // Clean any existing scanner before starting fresh
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }

        const scanner = new Html5Qrcode(viewportId.current, {
          formatsToSupport,
          verbose: false,
        });

        scannerRef.current = scanner;

        // Smooth 15-20 fps configuration without forcing restrictive hardware aspect ratio
        const scanConfig = {
          fps: 16,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            if (mode === 'qr') {
              const edge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.max(180, Math.floor(edge * 0.70));
              return { width: size, height: size };
            } else {
              // Barcode format: Wide horizontal box
              const w = Math.min(viewfinderWidth * 0.88, 300);
              const h = Math.min(viewfinderHeight * 0.44, 120);
              return { width: Math.floor(w), height: Math.floor(h) };
            }
          },
        };

        // Try environment camera first, then user camera
        try {
          await scanner.start(
            { facingMode: facingMode },
            scanConfig,
            (decodedText: string) => handleDecodedRef.current(decodedText),
            () => {} // Frame scan in-progress
          );
        } catch (camErr) {
          console.warn('FacingMode camera failed, trying fallback camera:', camErr);
          await scanner.start(
            { facingMode: facingMode === 'environment' ? 'user' : 'environment' },
            scanConfig,
            (decodedText: string) => handleDecodedRef.current(decodedText),
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
  }, [isOpen, mode, facingMode, stopScanner]);

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

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Frosted Glass Backdrop Blur (Soft overlay so background blurs smoothly) */}
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      >
        
        {/* =============================================================== */}
        {/* SCREEN 1: PRE-SCAN SELECTION (LIGHT THEME MATCHED 2 CIRCLES)   */}
        {/* =============================================================== */}
        {mode === 'select' && (
          <div className="relative w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 font-sans">
            
            {/* Top Row: Title + Close Button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                  <Scan className="w-4 h-4" />
                </div>
                <span className="text-xs font-black font-mono tracking-wider text-slate-800 uppercase">
                  Select Scanner
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The 2 Big Clean Circles (Theme Matched) */}
            <div className="flex items-center justify-center gap-8 sm:gap-10 py-6">
              
              {/* CIRCLE 1: QR CODE */}
              <button
                type="button"
                onClick={() => setMode('qr')}
                className="group flex flex-col items-center gap-2.5 transition-transform active:scale-95 cursor-pointer focus:outline-none"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-50 border-2 border-blue-400/60 group-hover:border-blue-600 group-hover:bg-blue-100/70 shadow-lg shadow-blue-500/10 flex items-center justify-center text-blue-600 transition-all">
                  <QrCode className="w-11 h-11 sm:w-12 sm:h-12 stroke-[1.8]" />
                </div>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-800 group-hover:text-blue-600 transition-colors">
                  QR Code
                </span>
              </button>

              {/* CIRCLE 2: BAR CODE */}
              <button
                type="button"
                onClick={() => setMode('barcode')}
                className="group flex flex-col items-center gap-2.5 transition-transform active:scale-95 cursor-pointer focus:outline-none"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-50 border-2 border-amber-400/60 group-hover:border-amber-600 group-hover:bg-amber-100/70 shadow-lg shadow-amber-500/10 flex items-center justify-center text-amber-600 transition-all">
                  <Barcode className="w-11 h-11 sm:w-12 sm:h-12 stroke-[1.8]" />
                </div>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-800 group-hover:text-amber-600 transition-colors">
                  Bar Code
                </span>
              </button>

            </div>

          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 2: ACTIVE LIVE CAMERA VIEWFINDER (THEME MATCHED)         */}
        {/* =============================================================== */}
        {mode !== 'select' && (
          <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 font-sans">
            
            {/* Top Control Bar (Clean ERP Light Theme) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
              
              {/* Back to 2 Circles Button */}
              <button
                type="button"
                onClick={() => setMode('select')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all border border-slate-200 active:scale-95 shadow-2xs"
                title="Back to options"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {/* Current Active Mode Badge */}
              <div className="flex items-center gap-1.5">
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-2xs ${
                  mode === 'qr'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {mode === 'qr' ? (
                    <>
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>QR Code</span>
                    </>
                  ) : (
                    <>
                      <Barcode className="w-3.5 h-3.5 text-amber-600" />
                      <span>Bar Code</span>
                    </>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                </span>
              </div>

              {/* Right Action Icons (Torch, Flip, Close) */}
              <div className="flex items-center gap-1.5">
                {/* Torch toggle */}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isTorchOn 
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md shadow-amber-400/20' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
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
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all shadow-2xs"
                  title="Switch Camera (Front/Back)"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  title="Close Scanner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Camera Viewport & HUD Overlay */}
            <div className="relative w-full aspect-square bg-slate-950 overflow-hidden flex items-center justify-center">
              
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
                    Starting {mode === 'qr' ? 'QR Code' : 'Bar Code'} Scanner...
                  </p>
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
                      Back
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

            {/* Bottom Quick Switch (Clean ERP Light Theme Footer) */}
            <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setMode(mode === 'qr' ? 'barcode' : 'qr')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs active:scale-95"
              >
                <RefreshCw className="w-3 h-3 text-amber-600" />
                <span>Switch to {mode === 'qr' ? 'Bar Code' : 'QR Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('select')}
                className="text-xs font-mono font-bold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors"
              >
                Change Mode
              </button>
            </div>
          </div>
        )}

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
