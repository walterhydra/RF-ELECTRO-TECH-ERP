'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Play, Video, ShieldCheck, Film } from 'lucide-react';

export default function VideoDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/job-cards"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              Job Card System Live Video Demo (MP4)
            </h1>
            <p className="text-xs text-slate-400 font-mono">ERP Walkthrough & Feature Verification Recording</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/job_card_flow_demo.mp4"
            download="job_card_flow_demo.mp4"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-400"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>DOWNLOAD MP4 VIDEO</span>
          </a>
        </div>
      </div>

      {/* Main Player Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Browser Workflow Playback (MP4 Video)
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
              Format: MP4 (H.264 / AVC)
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center shadow-xl">
            <video
              src="/job_card_flow_demo.mp4"
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto object-contain max-h-[75vh]"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Recorded steps: <strong className="text-white">Job Launch ➔ Barcode Scan ➔ Full & Split Stage Movement ➔ Excel Export ➔ PDF Audit</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href="/job_card_flow_demo.mp4"
                download="job_card_flow_demo.mp4"
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-400"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>DOWNLOAD MP4 (RECOMMENDED)</span>
              </a>
              <a
                href="/job_card_flow_demo.webp"
                download="job_card_flow_demo.webp"
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700"
              >
                <span>WEBP</span>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
