'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete, Copy, Check, Sparkles } from 'lucide-react';

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState('');
  const [copied, setCopied] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);

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
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  // Decimal point
  const inputDecimal = () => {
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
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory('');
  };

  // Backspace
  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Percentage
  const inputPercent = () => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const result = current / 100;
    setDisplay(String(Number(result.toFixed(8))));
    setWaitingForOperand(true);
  };

  // Toggle plus/minus sign
  const toggleSign = () => {
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
      {/* ── HIGH-TECH GLASS POPUP CARD ── */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[295px] sm:w-[315px] bg-[#070b14]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-white animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase font-mono">
                ERP Math Utility
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Result"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* OLED Display Chamber */}
          <div className="my-3.5 p-3.5 bg-black/70 rounded-2xl border border-white/[0.08] shadow-inner flex flex-col justify-end text-right">
            <div className="text-[11px] font-mono text-slate-400 tracking-wider h-4 overflow-hidden truncate">
              {history || '\u00A0'}
            </div>
            <div 
              onClick={handleCopy}
              title="Click to copy"
              className="text-3xl sm:text-4xl font-mono font-semibold text-white tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none cursor-pointer hover:text-cyan-300 transition-colors py-0.5"
            >
              {display}
            </div>
            {copied && (
              <span className="text-[9px] font-mono text-cyan-400 font-medium mt-0.5">
                Copied to clipboard
              </span>
            )}
          </div>

          {/* Keypad Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-2 text-sm font-medium">
            {/* Row 1 */}
            <button
              type="button"
              onClick={clearAll}
              className="h-10.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-300 border border-rose-500/20 active:scale-95 transition-all flex items-center justify-center font-bold font-mono cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={backspace}
              title="Backspace"
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-300 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={inputPercent}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-300 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono cursor-pointer"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => performOperation('÷')}
              className={`h-10.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '÷'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
              }`}
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => inputDigit('7')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => inputDigit('8')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => inputDigit('9')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => performOperation('×')}
              className={`h-10.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '×'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
              }`}
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => inputDigit('4')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => inputDigit('5')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => inputDigit('6')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => performOperation('-')}
              className={`h-10.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '-'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
              }`}
            >
              −
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => inputDigit('1')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => inputDigit('2')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => inputDigit('3')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => performOperation('+')}
              className={`h-10.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '+'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
              }`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={toggleSign}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-300 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-sm cursor-pointer"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => inputDigit('0')}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={inputDecimal}
              className="h-10.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-100 border border-white/[0.06] active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-10.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold font-mono text-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all flex items-center justify-center border border-cyan-300/40 cursor-pointer"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* ── HIGH-TECH AI/FUTURISTIC CIRCULAR FAB ── */}
      <div className="relative group">
        {/* Ambient subtle multi-color gradient aura */}
        <div 
          className={`absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 blur-sm opacity-60 group-hover:opacity-100 transition duration-500 pointer-events-none ${
            isOpen ? 'opacity-80' : ''
          }`} 
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle ERP Calculator"
          title={isOpen ? 'Close Calculator' : 'Quick ERP Calculator'}
          className={`relative w-12 h-12 sm:w-12.5 sm:h-12.5 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-slate-950/90 text-white border-white/20 rotate-90 scale-100'
              : 'bg-slate-950/90 hover:bg-slate-900 text-slate-200 hover:text-white border-white/15 hover:border-cyan-400/50 hover:scale-105 active:scale-95'
          }`}
        >
          {isOpen ? (
            <X strokeWidth={1.8} className="w-5 h-5 text-white transition-transform" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Calculator strokeWidth={1.6} className="w-5 h-5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
              {/* Micro indicator dot */}
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
