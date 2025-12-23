import React from "react";

export default function Features() {
  return (
    <div id="features" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Targeted Prep for Top Roles</h2>
        <p className="text-slate-400">Our agent adapts the interview based on your experience and target company.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Company-Targeted Rounds</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Leverage our integration with <span className="text-white font-semibold">LeetCode Premium datasets</span>. Enter any company name and the AI will pull real questions asked in their interviews.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition group">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Smart Topic Filtering</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Customize your session by selecting specific DSA topics. Focus on <span className="text-white font-semibold">Dynamic Programming, Graphs, or Low-Level Design</span>.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition group">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Vocal Logic Verification</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            The IDE stays locked until you explain your approach. The AI listens for time/space complexity and logic flow.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition group">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Deep Result Analysis</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Receive a detailed breakdown of your performance, from code efficiency and edge-case handling to communication clarity.
          </p>
        </div>
      </div>
    </div>
  );
}
