"use client";

import React, { useRef } from "react";

export default function Preview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Set to a real video URL to enable demo playback. Leave empty/null to disable <source>.
  const demoSrc: string | null = null;

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  return (
    <div id="preview" className="max-w-5xl mx-auto rounded-2xl border border-white/10 overflow-hidden shadow-2xl glass-card mb-24">
      <div className="h-10 bg-slate-800/80 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          <div className="ml-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Project Demo: Platform Overview</div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono hidden sm:block">HTTPS://CODENT.AI/DEMO</div>
      </div>
      <div className="grid grid-cols-12 h-[500px]">
        <div className="col-span-12 md:col-span-4 border-r border-white/5 p-6 bg-slate-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1 h-8 items-end">
                <div className="wave-bar" style={{ animationDelay: "0.1s" }}></div>
                <div className="wave-bar" style={{ animationDelay: "0.3s" }}></div>
                <div className="wave-bar" style={{ animationDelay: "0.2s" }}></div>
                <div className="wave-bar" style={{ animationDelay: "0.4s" }}></div>
              </div>
              <span className="text-xs font-bold text-blue-400">AGENT ACTIVE</span>
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Current Instruction</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">"Watch how the AI monitors the logic flow and only enables the editor once the approach is explained."</p>

            <div className="space-y-3">
              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 text-[11px] text-blue-300">
                <span className="font-bold">✓</span> Company: Google (Past Year)
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-slate-400">
                <span className="font-bold">✓</span> Mode: Logic Validation
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono border-t border-white/5 pt-4">INTERVIEW_ID: CX-2025-01</div>
        </div>

        <div className="col-span-12 md:col-span-8 bg-black relative group video-container">
          <video ref={videoRef} id="demo-player" className="w-full h-full object-cover opacity-80" poster="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031&auto=format&fit=crop">
            {/** Only include a <source> if `demoSrc` is provided to avoid passing an empty string to `src`. */}
            {demoSrc ? <source src={demoSrc} type="video/mp4" /> : null}
          </video>

          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all cursor-pointer" onClick={togglePlay}>
            <div id="play-btn" className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-[10px] bg-slate-900/80 px-3 py-1 rounded border border-white/10 text-slate-400 backdrop-blur-sm">Click to play demo</div>
        </div>
      </div>
    </div>
  );
}
