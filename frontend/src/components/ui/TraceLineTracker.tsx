import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface TraceStage {
  name: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  hasRejection?: boolean;
}

interface TraceLineTrackerProps {
  stages: TraceStage[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function TraceLineTracker({ stages, orientation = 'horizontal', className = '' }: TraceLineTrackerProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center w-full' : 'flex-col items-start h-full'} ${className}`}>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        
        let nodeColor = 'border-slate-300 bg-slate-50'; // PENDING
        let nodeIcon = null;
        let lineClass = 'border-dashed border-slate-300';
        
        if (stage.status === 'COMPLETED') {
          nodeColor = 'border-blue-600 bg-blue-600 text-white';
          nodeIcon = <Check className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />;
          lineClass = 'border-solid border-blue-600';
        } else if (stage.status === 'ACTIVE') {
          nodeColor = 'border-blue-600 bg-white border-2 animate-pulse';
          nodeIcon = <div className="w-2 h-2 rounded-full bg-blue-600" />;
          lineClass = 'border-dashed border-blue-600';
        }

        return (
          <div key={index} className={`flex ${isHorizontal ? 'flex-row items-center flex-1' : 'flex-col items-center flex-1 min-h-[60px]'}`}>
            {/* Node */}
            <div className="relative flex flex-col items-center">
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-colors duration-300 ${nodeColor}`}>
                {nodeIcon}
              </div>
              
              {/* Rejection Badge */}
              {stage.hasRejection && (
                <div className={`absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-600 rounded-full text-white p-0.5 z-20`} title="Rejections logged at this stage">
                  <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              )}
              
              {/* Label below node (horizontal) or right of node (vertical) */}
              <div className={`absolute ${isHorizontal ? 'top-10 text-center w-24 -ml-8 md:-ml-8' : 'left-10 md:left-12 top-1 whitespace-nowrap'} `}>
                <span className={`text-xs md:text-sm font-medium ${stage.status === 'ACTIVE' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                  {stage.name}
                </span>
              </div>
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div 
                className={`flex-1 transition-colors duration-300 ${
                  isHorizontal ? `h-0 border-t-2 w-full mx-2 ${lineClass}` : `w-0 border-l-2 h-full my-2 ${lineClass}`
                }`} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
