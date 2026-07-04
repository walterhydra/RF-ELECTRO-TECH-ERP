'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  className,
  disabled = false,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (disabled) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (disabled) return;
    onChange(Math.min(max, value + step));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < min) onChange(min);
    else if (val > max) onChange(max);
    else onChange(val);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="w-12 h-12 flex items-center justify-center rounded-l-md bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-5 h-5 text-slate-900" />
      </button>
      
      <input
        type="number"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        className="h-12 w-24 text-center font-mono text-lg border-y border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      />
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="w-12 h-12 flex items-center justify-center rounded-r-md bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-5 h-5 text-slate-900" />
      </button>
    </div>
  );
}
