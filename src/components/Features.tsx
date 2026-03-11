"use client";

import React from "react";

type FeatureItem = {
  title: string;
  description: React.ReactNode;
  iconColor: string;
  iconBg: string;
  iconPath: string;
  accentGlow: string;
};

const features: FeatureItem[] = [
  {
    title: "Company-Targeted Rounds",
    description: (
      <>
        Leverage our integration with <span className="text-white font-semibold">LeetCode Premium datasets.</span> Enter
        any company name and the AI will pull real questions asked in their interviews.
      </>
    ),
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    accentGlow: "bg-blue-500/20",
    iconPath:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Smart Topic Filtering",
    description: (
      <>
        Customize your session by selecting specific DSA topics. Focus on{" "}
        <span className="text-white font-semibold">Dynamic Programming, Graphs, or Low-Level Design.</span>
      </>
    ),
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    accentGlow: "bg-purple-500/20",
    iconPath:
      "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z",
  },
  {
    title: "Vocal Logic Verification",
    description: "The IDE stays locked until you explain your approach. The AI listens for time/space complexity and logic flow.",
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
    accentGlow: "bg-green-500/20",
    iconPath: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  },
  {
    title: "Deep Result Analysis",
    description: "Receive a detailed breakdown of your performance, from code efficiency and edge-case handling to communication clarity.",
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/10",
    accentGlow: "bg-yellow-500/20",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

export default function Features() {
  return (
    <div id="features" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Targeted Prep for Top Roles</h2>
        <p className="text-slate-400">
          Our agent adapts the interview based on your experience and target company.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <div className="features-carousel-container">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group feature-card-animated relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(15,23,42,0.62))] p-8 shadow-[0_12px_36px_rgba(2,6,23,0.32)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_44px_rgba(2,6,23,0.45)]"
            >
              <div className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl ${feature.accentGlow}`} aria-hidden="true"></div>

              <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 ${feature.iconBg}`}>
                <svg className={`w-6 h-6 ${feature.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.iconPath}></path>
                </svg>
              </div>
              <h3 className="relative z-10 text-2xl font-semibold tracking-tight mb-3">{feature.title}</h3>
              <p className="relative z-10 text-slate-300/90 text-base leading-8">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
