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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);

  // Subtle modern haptic UI click (gentle, crisp 15ms tick)
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.015);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.015);
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

  // Global event listeners to open/toggle from modals or buttons
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('toggle-calculator', handleToggle);
    window.addEventListener('open-calculator', handleOpen);
    return () => {
      window.removeEventListener('toggle-calculator', handleToggle);
      window.removeEventListener('open-calculator', handleOpen);
    };
  }, []);

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

  // Dynamic font sizing based on display characters
  const getDisplayFontSize = (text: string) => {
    if (text.length > 14) return 'text-xl sm:text-2xl';
    if (text.length > 10) return 'text-2xl sm:text-3xl';
    return 'text-3xl sm:text-4xl';
  };

  return (
    <div ref={calcRef} className={`fixed bottom-5 right-5 ${isOpen ? 'z-[9999999]' : 'z-40'} select-none font-sans`}>
      {/* ── PROFESSIONAL CLEAN CALCULATOR POPUP ── */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[290px] sm:w-[310px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] text-slate-800 animate-in fade-in zoom-in-95 duration-150 z-[9999999]">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-100/80">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 tracking-tight">Calculator</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute click sound' : 'Enable click sound'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy result"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── PROFESSIONAL SLEEK DISPLAY ── */}
          <div 
            onClick={handleCopy}
            title="Click to copy result"
            className="my-3.5 px-4 py-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between text-right cursor-pointer group transition-all hover:border-slate-700 relative overflow-hidden"
          >
            {/* Subtle gloss highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

            {/* Expression History */}
            <div className="h-5 flex items-center justify-between text-xs font-mono text-slate-400 relative z-10">
              <span className="text-[10px] text-slate-500 font-sans font-medium tracking-wider uppercase">
                {copied ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 inline" /> Copied
                  </span>
                ) : (
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">Copy</span>
                )}
              </span>
              <div className="truncate max-w-[190px] font-mono text-slate-400">
                {history || '\u00A0'}
              </div>
            </div>

            {/* Main Result Display */}
            <div 
              className={`${getDisplayFontSize(display)} font-mono font-bold tracking-tight text-white overflow-x-auto whitespace-nowrap scrollbar-none py-1 relative z-10`}
            >
              {display}
            </div>
          </div>

          {/* ── CLEAN KEYPAD GRID ── */}
          <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
            {/* Row 1 */}
            <button
              type="button"
              onClick={clearAll}
              title="Clear All (Esc)"
              className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              {display !== '0' || prevValue !== null ? 'C' : 'AC'}
            </button>
            <button
              type="button"
              onClick={backspace}
              title="Backspace"
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={inputPercent}
              title="Percentage"
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm font-mono"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => performOperation('÷')}
              className={`h-11 rounded-xl text-lg font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                operation === '÷'
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70'
              }`}
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => inputDigit('7')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => inputDigit('8')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => inputDigit('9')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => performOperation('×')}
              className={`h-11 rounded-xl text-lg font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                operation === '×'
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70'
              }`}
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => inputDigit('4')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => inputDigit('5')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => inputDigit('6')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => performOperation('-')}
              className={`h-11 rounded-xl text-lg font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                operation === '-'
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70'
              }`}
            >
              −
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => inputDigit('1')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => inputDigit('2')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => inputDigit('3')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => performOperation('+')}
              className={`h-11 rounded-xl text-lg font-bold active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                operation === '+'
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70'
              }`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={toggleSign}
              title="Toggle Positive / Negative"
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm font-mono text-sm"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => inputDigit('0')}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={inputDecimal}
              className="h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm active:scale-95 transition-all font-mono text-base flex items-center justify-center cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              title="Calculate (= or Enter)"
              className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-blue-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md shadow-blue-500/25 font-bold text-xl"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING TRIGGER BUTTON ── */}
      <button
        type="button"
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        aria-label="Toggle Calculator"
        title={isOpen ? 'Close Calculator' : 'Open Calculator'}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white border border-slate-800 shadow-slate-900/30 rotate-90 scale-95'
            : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 shadow-slate-900/10 hover:shadow-xl hover:scale-105 active:scale-95'
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

