"use client";

import React from "react";

function dispatchToggle(mode?: string | null) {
  window.dispatchEvent(new CustomEvent("toggleAuth", { detail: mode ?? null }));
}

export default function Nav() {
  return (
    <nav className="fixed w-full z-50 border-b border-white/5 glass-card py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">C</div>
          <span className="text-xl font-bold tracking-tight">
            Codent<span className="text-blue-500">AI</span>
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="nav-link">Features</a>
          <a href="#preview" className="nav-link">Project Demo</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>

        <div className="flex gap-4">
          <button onClick={() => dispatchToggle("login")} className="text-sm font-medium hover:text-white transition">Log in</button>
          <button onClick={() => dispatchToggle("signup")} className="glow-button bg-blue-600 px-5 py-2 rounded-lg text-sm font-semibold">Get Started</button>
        </div>
      </div>
    </nav>
  );
}
