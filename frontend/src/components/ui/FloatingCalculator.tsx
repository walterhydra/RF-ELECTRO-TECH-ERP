'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete, Copy, Check, Volume2, VolumeX } from 'lucide-react';

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState('');
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const calcRef = useRef<HTMLDivElement>(null);

  // Mechanical switch audio click via Web Audio API (synthetic, 100% offline & instant)
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        calcRef.current &&
        !calcRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Digits input
  const inputDigit = (digit: string) => {
    playClickSound();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  // Decimal point
  const inputDecimal = () => {
    playClickSound();
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  // Clear all
  const clearAll = () => {
    playClickSound();
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory('');
  };

  // Backspace
  const backspace = () => {
    playClickSound();
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Percentage
  const inputPercent = () => {
    playClickSound();
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const result = current / 100;
    setDisplay(String(Number(result.toFixed(8))));
    setWaitingForOperand(true);
  };

  // Toggle plus/minus sign
  const toggleSign = () => {
    playClickSound();
    const current = parseFloat(display);
    if (isNaN(current) || current === 0) return;
    setDisplay(String(-current));
  };

  // Safe calculation
  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
      case '*':
        return a * b;
      case '÷':
      case '/':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  // Operator handling
  const performOperation = (nextOp: string) => {
    playClickSound();
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistory(`${display} ${nextOp}`);
    } else if (operation && !waitingForOperand) {
      const result = calculate(prevValue, inputValue, operation);
      if (isNaN(result)) {
        setDisplay('Error');
        setPrevValue(null);
        setOperation(null);
        setHistory('');
        setWaitingForOperand(true);
        return;
      }
      const rounded = Number(result.toFixed(8));
      setDisplay(String(rounded));
      setPrevValue(rounded);
      setHistory(`${rounded} ${nextOp}`);
    } else {
      setHistory(`${prevValue} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  // Equals (=)
  const handleEquals = () => {
    playClickSound();
    if (prevValue === null || operation === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(prevValue, inputValue, operation);

    if (isNaN(result)) {
      setDisplay('Error');
      setHistory('');
    } else {
      const rounded = Number(result.toFixed(8));
      setHistory(`${prevValue} ${operation} ${inputValue} =`);
      setDisplay(String(rounded));
    }

    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !calcRef.current?.contains(target)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        performOperation(e.key);
      } else if (e.key === '*') {
        e.preventDefault();
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, prevValue, operation, waitingForOperand]);

  // Copy result
  const handleCopy = () => {
    if (!display || display === 'Error') return;
    navigator.clipboard?.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={calcRef} className="fixed bottom-5 right-5 z-[9999] select-none font-sans">
      {/* ── MECHANICAL CALCULATOR POPUP ── */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[295px] sm:w-[315px] bg-[#eef2f6] border-2 border-[#cbd5e1] rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.22),inset_0_2px_0_rgba(255,255,255,0.9)] text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Mechanical Top Bezel & Solar Cell */}
          <div className="flex items-center justify-between pb-3 border-b border-[#cbd5e1]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase font-mono bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300">
                RF-TECH 100M
              </span>
            </div>

            {/* Realistic Photovoltaic Solar Panel */}
            <div className="flex items-center gap-2">
              <div 
                title="Solar Cell" 
                className="grid grid-cols-4 gap-0.5 bg-[#2c1810] p-0.5 rounded border border-[#4a2818] shadow-inner"
              >
                <div className="w-2.5 h-3.5 bg-gradient-to-b from-[#3d2319] to-[#25150e] rounded-[1px]" />
                <div className="w-2.5 h-3.5 bg-gradient-to-b from-[#3d2319] to-[#25150e] rounded-[1px]" />
                <div className="w-2.5 h-3.5 bg-gradient-to-b from-[#3d2319] to-[#25150e] rounded-[1px]" />
                <div className="w-2.5 h-3.5 bg-gradient-to-b from-[#3d2319] to-[#25150e] rounded-[1px]" />
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute switch click' : 'Enable mechanical switch click'}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── REALISTIC VINTAGE LCD DISPLAY ── */}
          <div className="my-3.5 p-3.5 bg-[#dbe5d6] border-2 border-[#94a3b8] rounded-xl shadow-[inset_0_3px_8px_rgba(0,0,0,0.35)] flex flex-col justify-between text-right relative">
            {/* Screen shine reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5 pointer-events-none rounded-lg" />

            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#3d4d3a] tracking-widest relative z-10">
              <span className="opacity-75">12-DIGIT</span>
              <div className="flex items-center gap-2">
                {operation && (
                  <span className="bg-[#243321] text-[#dbe5d6] px-1 rounded text-[9px]">
                    {operation}
                  </span>
                )}
                <div className="h-3.5 overflow-hidden truncate max-w-[170px]">
                  {history || '\u00A0'}
                </div>
              </div>
            </div>

            <div 
              onClick={handleCopy}
              title="Click to copy result"
              className="text-3xl sm:text-4xl font-mono font-black text-[#132010] tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none cursor-pointer hover:opacity-80 transition-opacity py-0.5 relative z-10"
            >
              {display}
            </div>

            {copied && (
              <span className="text-[9px] font-mono font-bold text-[#1b4317] mt-0.5 relative z-10">
                COPIED TO CLIPBOARD
              </span>
            )}
          </div>

          {/* ── MECHANICAL KEYPAD TRAY (RECESSED PLATE) ── */}
          <div className="p-2 bg-[#dce4ee] rounded-2xl border border-[#cbd5e1] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
            <div className="grid grid-cols-4 gap-2 text-sm font-bold">
              {/* Row 1 */}
              <button
                type="button"
                onClick={clearAll}
                title="Clear All"
                className="h-11 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white border-t-2 border-rose-300 shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-[0_0px_0_#9f1239] font-mono font-extrabold transition-all flex items-center justify-center cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={backspace}
                title="Backspace"
                className="h-11 rounded-xl bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={inputPercent}
                className="h-11 rounded-xl bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono transition-all flex items-center justify-center cursor-pointer"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => performOperation('÷')}
                className={`h-11 rounded-xl font-mono text-xl transition-all flex items-center justify-center cursor-pointer border-t-2 ${
                  operation === '÷'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_0_#1e3a8a] translate-y-0.5'
                    : 'bg-[#334155] hover:bg-[#1e293b] text-white border-slate-500 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-[0_0px_0_#0f172a]'
                }`}
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => inputDigit('7')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => inputDigit('8')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => inputDigit('9')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => performOperation('×')}
                className={`h-11 rounded-xl font-mono text-xl transition-all flex items-center justify-center cursor-pointer border-t-2 ${
                  operation === '×'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_0_#1e3a8a] translate-y-0.5'
                    : 'bg-[#334155] hover:bg-[#1e293b] text-white border-slate-500 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-[0_0px_0_#0f172a]'
                }`}
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => inputDigit('4')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => inputDigit('5')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => inputDigit('6')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => performOperation('-')}
                className={`h-11 rounded-xl font-mono text-xl transition-all flex items-center justify-center cursor-pointer border-t-2 ${
                  operation === '-'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_0_#1e3a8a] translate-y-0.5'
                    : 'bg-[#334155] hover:bg-[#1e293b] text-white border-slate-500 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-[0_0px_0_#0f172a]'
                }`}
              >
                −
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => inputDigit('1')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => inputDigit('2')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => inputDigit('3')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => performOperation('+')}
                className={`h-11 rounded-xl font-mono text-xl transition-all flex items-center justify-center cursor-pointer border-t-2 ${
                  operation === '+'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_0_#1e3a8a] translate-y-0.5'
                    : 'bg-[#334155] hover:bg-[#1e293b] text-white border-slate-500 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-[0_0px_0_#0f172a]'
                }`}
              >
                +
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={toggleSign}
                className="h-11 rounded-xl bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-sm transition-all flex items-center justify-center cursor-pointer"
              >
                ±
              </button>
              <button
                type="button"
                onClick={() => inputDigit('0')}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={inputDecimal}
                className="h-11 rounded-xl bg-[#fdfefe] hover:bg-[#f1f5f9] text-slate-800 border-t-2 border-white shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-[0_0px_0_#94a3b8] font-mono text-base transition-all flex items-center justify-center cursor-pointer"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="h-11 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-t-2 border-blue-400 shadow-[0_4px_0_#1e3a8a] active:translate-y-1 active:shadow-[0_0px_0_#1e3a8a] font-mono text-2xl font-black transition-all flex items-center justify-center cursor-pointer"
              >
                =
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAN WHITE CIRCULAR BUTTON (CORNER POPUP) ── */}
      <button
        type="button"
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        aria-label="Calculator"
        title={isOpen ? 'Close' : 'Calculator'}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border-slate-700'
            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border-slate-300 hover:border-blue-400 hover:shadow-xl hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Calculator className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
