'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete, Copy, Check } from 'lucide-react';

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

  // Safe floating point calculation
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

  // Keyboard support when calculator popup is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an external text input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !calcRef.current?.contains(target)) {
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

  // Copy result to clipboard
  const handleCopy = () => {
    if (!display || display === 'Error') return;
    navigator.clipboard?.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={calcRef} className="fixed bottom-5 right-5 z-[9999] select-none">
      {/* ── CALCULATOR POPUP CARD ── */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[290px] sm:w-[310px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">
                ERP Calculator
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Result"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Display Screen */}
          <div className="my-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-end text-right">
            <div className="text-[11px] font-mono text-slate-400 tracking-wider h-4 overflow-hidden truncate">
              {history || '\u00A0'}
            </div>
            <div 
              onClick={handleCopy}
              title="Click to copy"
              className="text-3xl font-bold font-mono text-white tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none cursor-pointer hover:text-blue-200 transition-colors"
            >
              {display}
            </div>
            {copied && (
              <span className="text-[9px] font-mono text-emerald-400 font-semibold mt-0.5">
                Copied to clipboard!
              </span>
            )}
          </div>

          {/* Keypad Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
            {/* Row 1 */}
            <button
              type="button"
              onClick={clearAll}
              className="h-11 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 active:scale-95 transition-all flex items-center justify-center font-bold font-mono cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={backspace}
              title="Backspace"
              className="h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={inputPercent}
              className="h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 active:scale-95 transition-all flex items-center justify-center font-mono cursor-pointer"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => performOperation('÷')}
              className={`h-11 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '÷'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
              }`}
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => inputDigit('7')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => inputDigit('8')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => inputDigit('9')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => performOperation('×')}
              className={`h-11 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '×'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
              }`}
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => inputDigit('4')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => inputDigit('5')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => inputDigit('6')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => performOperation('-')}
              className={`h-11 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '-'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
              }`}
            >
              −
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => inputDigit('1')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => inputDigit('2')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => inputDigit('3')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => performOperation('+')}
              className={`h-11 rounded-xl border active:scale-95 transition-all flex items-center justify-center text-lg font-bold font-mono cursor-pointer ${
                operation === '+'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
              }`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={toggleSign}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-sm cursor-pointer"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => inputDigit('0')}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={inputDecimal}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white border border-slate-700/40 active:scale-95 transition-all flex items-center justify-center font-mono text-base cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold font-mono text-xl shadow-lg shadow-blue-600/40 active:scale-95 transition-all flex items-center justify-center border border-blue-400/50 cursor-pointer"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING CIRCLE BUTTON (CORNER FAB) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Calculator"
        title={isOpen ? 'Close Calculator' : 'Open Calculator'}
        className={`group relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/40 rotate-90 scale-105'
            : 'bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 hover:to-blue-900 text-blue-400 hover:text-white border-2 border-blue-500/40 hover:border-blue-400 shadow-blue-950/50 hover:shadow-blue-500/30 hover:scale-110 active:scale-95'
        }`}
      >
        {/* Glow halo */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-blue-500/20 blur-sm group-hover:bg-blue-500/40 transition-colors pointer-events-none" />
        )}

        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <Calculator className="w-6 h-6 transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
