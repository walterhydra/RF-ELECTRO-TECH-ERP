'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete, Copy, Check, History, Trash2, ArrowLeft } from 'lucide-react';

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  time: string;
}

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'history'>('calc');
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyExpr, setHistoryExpr] = useState('');
  const [copied, setCopied] = useState(false);
  const [memory, setMemory] = useState<number | null>(null);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
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

  // Helper to add to history tape
  const recordHistory = (expr: string, res: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      expression: expr,
      result: res,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistoryList((prev) => [newEntry, ...prev.slice(0, 24)]);
  };

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

  // Clear All
  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistoryExpr('');
  };

  // Clear Entry (current input only)
  const clearEntry = () => {
    setDisplay('0');
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
    const formatted = String(Number(result.toFixed(8)));
    setHistoryExpr(`${current}%`);
    setDisplay(formatted);
    setWaitingForOperand(true);
    recordHistory(`${current}%`, formatted);
  };

  // Quick GST 18% (vital for PCB manufacturing and job cards)
  const addGst18 = () => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const withGst = Number((current * 1.18).toFixed(4));
    const formatted = String(withGst);
    setHistoryExpr(`${current} + 18% GST`);
    setDisplay(formatted);
    setWaitingForOperand(true);
    recordHistory(`${current} + 18% GST`, formatted);
  };

  // Square Root (√)
  const handleSqrt = () => {
    const current = parseFloat(display);
    if (isNaN(current) || current < 0) {
      setDisplay('Error');
      return;
    }
    const result = Number(Math.sqrt(current).toFixed(8));
    const formatted = String(result);
    setHistoryExpr(`√(${current})`);
    setDisplay(formatted);
    setWaitingForOperand(true);
    recordHistory(`√(${current})`, formatted);
  };

  // Square (x²)
  const handleSquare = () => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const result = Number((current * current).toFixed(8));
    const formatted = String(result);
    setHistoryExpr(`sqr(${current})`);
    setDisplay(formatted);
    setWaitingForOperand(true);
    recordHistory(`sqr(${current})`, formatted);
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
      setHistoryExpr(`${display} ${nextOp}`);
    } else if (operation && !waitingForOperand) {
      const result = calculate(prevValue, inputValue, operation);
      if (isNaN(result)) {
        setDisplay('Error');
        setPrevValue(null);
        setOperation(null);
        setHistoryExpr('');
        setWaitingForOperand(true);
        return;
      }
      const rounded = Number(result.toFixed(8));
      setDisplay(String(rounded));
      setPrevValue(rounded);
      setHistoryExpr(`${rounded} ${nextOp}`);
    } else {
      setHistoryExpr(`${prevValue} ${nextOp}`);
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
      setHistoryExpr('');
    } else {
      const rounded = Number(result.toFixed(8));
      const expr = `${prevValue} ${operation} ${inputValue}`;
      setHistoryExpr(`${expr} =`);
      setDisplay(String(rounded));
      recordHistory(expr, String(rounded));
    }

    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  // Memory functions
  const memoryClear = () => setMemory(null);
  const memoryRecall = () => {
    if (memory !== null) {
      setDisplay(String(memory));
      setWaitingForOperand(true);
    }
  };
  const memoryAdd = () => {
    const current = parseFloat(display) || 0;
    setMemory((prev) => (prev || 0) + current);
    setWaitingForOperand(true);
  };
  const memorySubtract = () => {
    const current = parseFloat(display) || 0;
    setMemory((prev) => (prev || 0) - current);
    setWaitingForOperand(true);
  };

  // Number formatting with commas for readable large numbers
  const formatNumber = (val: string) => {
    if (val === 'Error' || val === 'NaN' || val === 'Infinity') return val;
    const parts = val.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts[1] !== undefined ? `${intPart}.${parts[1]}` : intPart;
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
    <div ref={calcRef} className="fixed bottom-6 right-6 z-[9999] select-none font-sans">
      {/* ── SPACIOUS PROFESSIONAL CALCULATOR POPUP ── */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-[340px] sm:w-[370px] bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-slate-900 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            {/* Tab switch: Calc / History */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('calc')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'calc'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {historyList.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
                    {historyList.length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy current result"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── TAB 1: STANDARD CALCULATOR ── */}
          {activeTab === 'calc' && (
            <div className="space-y-3 pt-3">
              {/* Spacious Digital Display Screen */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between min-h-[95px] text-right">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {memory !== null && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                        M = {formatNumber(String(memory))}
                      </span>
                    )}
                  </div>
                  <div className="h-4 overflow-hidden truncate">
                    {historyExpr || '\u00A0'}
                  </div>
                </div>
                
                <div 
                  onClick={handleCopy}
                  title="Click to copy"
                  className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none cursor-pointer hover:text-blue-600 transition-colors py-1"
                >
                  {formatNumber(display)}
                </div>

                {copied && (
                  <span className="text-[10px] font-semibold text-emerald-600">
                    Copied to clipboard!
                  </span>
                )}
              </div>

              {/* Memory Row + Quick GST */}
              <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={memoryClear}
                  disabled={memory === null}
                  title="Memory Clear"
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  MC
                </button>
                <button
                  type="button"
                  onClick={memoryRecall}
                  disabled={memory === null}
                  title="Memory Recall"
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  MR
                </button>
                <button
                  type="button"
                  onClick={memoryAdd}
                  title="Memory Add"
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  M+
                </button>
                <button
                  type="button"
                  onClick={memorySubtract}
                  title="Memory Subtract"
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  M−
                </button>
                <button
                  type="button"
                  onClick={addGst18}
                  title="Add 18% GST immediately"
                  className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold transition-colors cursor-pointer"
                >
                  +18% GST
                </button>
              </div>

              {/* Extended Functions Row */}
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={handleSqrt}
                  title="Square Root"
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={handleSquare}
                  title="Square (x²)"
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={inputPercent}
                  title="Percent"
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={backspace}
                  title="Backspace"
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Main Keypad Grid (4 columns × 5 rows) */}
              <div className="grid grid-cols-4 gap-2 text-base font-semibold">
                {/* Row 1 */}
                <button
                  type="button"
                  onClick={clearAll}
                  title="Clear All (AC)"
                  className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold font-mono active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  AC
                </button>
                <button
                  type="button"
                  onClick={clearEntry}
                  title="Clear Entry (CE)"
                  className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold font-mono active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  CE
                </button>
                <button
                  type="button"
                  onClick={toggleSign}
                  className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  ±
                </button>
                <button
                  type="button"
                  onClick={() => performOperation('÷')}
                  className={`h-12 rounded-xl border font-bold font-mono text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                    operation === '÷'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  ÷
                </button>

                {/* Row 2 */}
                <button
                  type="button"
                  onClick={() => inputDigit('7')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  7
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('8')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  8
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('9')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  9
                </button>
                <button
                  type="button"
                  onClick={() => performOperation('×')}
                  className={`h-12 rounded-xl border font-bold font-mono text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                    operation === '×'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  ×
                </button>

                {/* Row 3 */}
                <button
                  type="button"
                  onClick={() => inputDigit('4')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  4
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('5')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('6')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  6
                </button>
                <button
                  type="button"
                  onClick={() => performOperation('-')}
                  className={`h-12 rounded-xl border font-bold font-mono text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                    operation === '-'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  −
                </button>

                {/* Row 4 */}
                <button
                  type="button"
                  onClick={() => inputDigit('1')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('2')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => inputDigit('3')}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => performOperation('+')}
                  className={`h-12 rounded-xl border font-bold font-mono text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                    operation === '+'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  +
                </button>

                {/* Row 5 */}
                <button
                  type="button"
                  onClick={() => inputDigit('0')}
                  className="col-span-2 h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={inputDecimal}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-lg font-bold font-mono active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={handleEquals}
                  className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-2xl shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: CALCULATION HISTORY TAPE ── */}
          {activeTab === 'history' && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Recent Calculations</span>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistoryList([])}
                    className="text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">No previous calculations yet.</p>
                </div>
              ) : (
                <div className="max-h-[310px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setDisplay(item.result);
                        setWaitingForOperand(true);
                        setActiveTab('calc');
                      }}
                      title="Click to recall this result"
                      className="pt-2 pb-1.5 px-2 hover:bg-blue-50/60 rounded-xl cursor-pointer transition-colors text-right group"
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>{item.time}</span>
                        <span>{item.expression} =</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-slate-800 group-hover:text-blue-600 transition-colors">
                        {formatNumber(item.result)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('calc')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Calculator</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── COMFORTABLE CORNER CIRCULAR BUTTON (FAB) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Calculator"
        title={isOpen ? 'Close' : 'Calculator'}
        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl border transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-800 rotate-90 scale-105'
            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border-slate-300 hover:border-blue-500 hover:shadow-2xl hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Calculator className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
