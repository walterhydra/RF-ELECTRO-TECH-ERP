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
  Volume2
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

export interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, rawText?: string) => void;
  title?: string;
  subtitle?: string;
}

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Instant Laser Scanner',
  subtitle = 'Auto-detecting QR & 1D Barcode'
}) => {
  const [isStarting, setIsStarting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const scannerRef = useRef<any>(null);
  const isScanningActiveRef = useRef(false);
  const viewportId = useRef(`instant-scanner-${Math.random().toString(36).substring(2, 9)}`);

  // Handle detection
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

  // Clean stop scanner
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

  // Initialize camera & scanner immediately when opened
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setIsLocked(false);
      setDetectedCode(null);
      setErrorMessage(null);
      setIsTorchOn(false);
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
        // Small delay to ensure Portal DOM element is rendered
        await new Promise((r) => setTimeout(r, 60));
        if (!isMounted) return;

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!isMounted) return;

        const element = document.getElementById(viewportId.current);
        if (!element) {
          throw new Error('Scanner viewport element not mounted');
        }

        const scanner = new Html5Qrcode(viewportId.current, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        const scanConfig = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(220, Math.floor(edge * 0.74));
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        };

        // Try primary camera, fallback to any available camera if environment fails
        try {
          await scanner.start(
            { facingMode: facingMode },
            scanConfig,
            (decodedText: string) => handleDecoded(decodedText),
            () => {} // Frame scan in-progress
          );
        } catch (camErr) {
          console.warn('Primary camera failed, trying fallback camera:', camErr);
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
  }, [isOpen, facingMode, handleDecoded, stopScanner]);

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

  // Flip Camera
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
        
        {/* Viewfinder Container Box */}
        <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scan className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 font-mono">
                  <span>{title}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono truncate">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
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
                  <Flashlight className="w-4 h-4" />
                </button>
              )}

              {/* Camera flip */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all"
                title="Switch Camera (Front/Back)"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all ml-1"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
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
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-mono font-bold text-amber-300">Activating Floor Camera Viewfinder...</p>
                <p className="text-[10px] text-slate-500 font-mono">Initializing live QR & Barcode stream</p>
              </div>
            )}

            {/* Error Overlay */}
            {errorMessage && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-xs font-bold text-rose-300">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setFacingMode((p) => (p === 'environment' ? 'user' : 'environment'))}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Try Alternate Camera
                </button>
              </div>
            )}

            {/* High-Tech HUD Viewfinder Reticle */}
            {!isStarting && !errorMessage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                
                {/* Center Target Box */}
                <div className={`relative w-64 h-64 sm:w-72 sm:h-72 transition-colors duration-200 ${
                  isLocked ? 'scale-105' : ''
                }`}>
                  
                  {/* Corner Target Brackets */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-200 ${
                    isLocked ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-amber-400 shadow-[0_0_10px_#f59e0b]'
                  }`} />
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-200 ${
                    isLocked ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-amber-400 shadow-[0_0_10px_#f59e0b]'
                  }`} />
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-200 ${
                    isLocked ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-amber-400 shadow-[0_0_10px_#f59e0b]'
                  }`} />
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-200 ${
                    isLocked ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-amber-400 shadow-[0_0_10px_#f59e0b]'
                  }`} />

                  {/* Animated Laser Scanning Beam */}
                  {!isLocked ? (
                    <div 
                      className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_#f59e0b]"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-2xl p-4 text-center space-y-2 animate-in zoom-in-95 duration-150">
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
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 text-[10.5px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Align Barcode or QR Code inside box</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Manual Entry Fallback */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">Torn / Damaged physical code?</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">Manual Search</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter Job Card No (e.g. 26-27-2432)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
              >
                <span>Find</span>
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Laser Scan Keyframe Animation CSS */}
      <style jsx global>{`
        @keyframes rfLaserScan {
          0% {
            top: 5%;
            opacity: 0.9;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.9;
          }
        }
      `}</style>
    </Portal>
  );
};
