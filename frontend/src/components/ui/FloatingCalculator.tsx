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
      {/* ── SIMPLE CLEAN CALCULATOR POPUP ── */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[280px] sm:w-[300px] bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                Calculator
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy result"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Simple Clean Screen */}
          <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-end text-right">
            <div className="text-[11px] font-mono text-slate-400 tracking-wider h-4 overflow-hidden truncate">
              {history || '\u00A0'}
            </div>
            <div 
              onClick={handleCopy}
              title="Click to copy"
              className="text-2xl sm:text-3xl font-semibold font-mono text-slate-900 tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none cursor-pointer hover:text-blue-600 transition-colors"
            >
              {display}
            </div>
            {copied && (
              <span className="text-[10px] font-medium text-emerald-600 mt-0.5">
                Copied!
              </span>
            )}
          </div>

          {/* Keypad Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5 text-sm">
            {/* Row 1 */}
            <button
              type="button"
              onClick={clearAll}
              className="h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold font-mono active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={backspace}
              title="Backspace"
              className="h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={inputPercent}
              className="h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-medium font-mono active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => performOperation('÷')}
              className={`h-10 rounded-lg border font-bold font-mono text-base active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                operation === '÷'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
              }`}
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => inputDigit('7')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => inputDigit('8')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => inputDigit('9')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => performOperation('×')}
              className={`h-10 rounded-lg border font-bold font-mono text-base active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                operation === '×'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
              }`}
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => inputDigit('4')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => inputDigit('5')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => inputDigit('6')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => performOperation('-')}
              className={`h-10 rounded-lg border font-bold font-mono text-base active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                operation === '-'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
              }`}
            >
              −
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => inputDigit('1')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => inputDigit('2')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => inputDigit('3')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => performOperation('+')}
              className={`h-10 rounded-lg border font-bold font-mono text-base active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                operation === '+'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
              }`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={toggleSign}
              className="h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium font-mono text-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => inputDigit('0')}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={inputDecimal}
              className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-lg shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* ── SIMPLE CLEAN CORNER BUTTON ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
