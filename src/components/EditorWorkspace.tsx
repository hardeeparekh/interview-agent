"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Editor from '@monaco-editor/react';
import { supabase } from "../lib/supabaseClient";

const ACTIVE_SESSION_STORAGE_KEY = "interview_agent_active_session_v1";

function createUuidFallback() {
  // Not cryptographically strong; only used if crypto.randomUUID is unavailable.
  return `id_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateStableSessionId(company: string, topic: string, duration: number) {
  if (typeof window === "undefined") return createUuidFallback();

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as any;
      const isFresh = typeof parsed?.ts === "number" && Date.now() - parsed.ts < 10_000;
      const matches = parsed?.company === company && parsed?.topic === topic && parsed?.duration === duration;
      if (isFresh && matches && typeof parsed?.id === "string" && parsed.id.length > 0) {
        return parsed.id as string;
      }
    }
  } catch {
    // ignore
  }

  const id = (globalThis as any)?.crypto?.randomUUID?.() ?? createUuidFallback();
  try {
    window.sessionStorage.setItem(
      ACTIVE_SESSION_STORAGE_KEY,
      JSON.stringify({ id, company, topic, duration, ts: Date.now() })
    );
  } catch {
    // ignore
  }
  return id as string;
}

type Props = {
  company: string;
  topic: string;
  duration: number;
  excludeTopics?: string[];
  onEnd?: () => void;
};

const FIXED_THREE_SUM_QUESTION = {
  title: "3Sum",
  description:
    'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.\n\nInput format for this editor:\n- First line: integer n\n- Second line: n space-separated integers\n\nOutput format for deterministic judging:\n- Print each unique triplet as "a b c" (values inside each triplet in nondecreasing order)\n- Print triplets in lexicographic order, one triplet per line\n- If no triplet exists, print []',
  examples: [
    { input: "6\n-1 0 1 2 -1 -4", output: "-1 -1 2\n-1 0 1" },
    { input: "3\n0 1 1", output: "[]" },
    { input: "5\n0 0 0 0 0", output: "0 0 0" },
  ],
  difficulty: "Medium",
  prompt:
    "Given an integer array nums, return all unique triplets whose sum is 0. Do not return duplicate triplets.",
};

function getDefaultThreeSumTestCases() {
  return (FIXED_THREE_SUM_QUESTION.examples || []).slice(0, 3).map((e: any) => ({
    input: String(e.input ?? ""),
    expected: String(e.output ?? e.expected ?? ""),
    custom: false,
  }));
}

export default function EditorWorkspace({ company, topic, duration, excludeTopics, onEnd }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [agentText, setAgentText] = useState("\"Connecting to session...\"");
  const [listening, setListening] = useState(false); // Default to false for text input initially
  const [editorValue, setEditorValue] = useState(`// Implement your solution here\n`);
  const editorRef = useRef<any | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(duration * 60);
  const sessionIdRef = useRef<string | null>(null);
  const startedAtMsRef = useRef<number>(Date.now());
  const endedRef = useRef(false);
  const startedInterviewKeyRef = useRef<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "result">("testcase");
  const [submissionStatus, setSubmissionStatus] = useState<"accepted" | "wrong" | "compile" | null>(null);
  
  // Agent State
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [interviewState, setInterviewState] = useState<'intro' | 'approach' | 'coding' | 'finished'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [language, setLanguage] = useState("C++ 17");
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [testCases, setTestCases] = useState<{ input: string; expected: string; custom?: boolean }[]>([]);
  const [testResults, setTestResults] = useState<{ input: string; expected: string; output?: string; passed: boolean; error?: string }[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{ line: number; column?: number; message: string }[]>([]);

  const excludeKey = (excludeTopics ?? []).filter(Boolean).join(",");
  const interviewKey = `${company}__${topic}__${duration}__${excludeKey}`;

  useEffect(() => {
    // Guard against duplicate calls in dev (React StrictMode) and against
    // parent rerenders that pass a new excludeTopics array instance.
    if (startedInterviewKeyRef.current === interviewKey) return;
    startedInterviewKeyRef.current = interviewKey;

    setUnlocked(false);
    setMessages([]);
    setInterviewState("intro");
    setCurrentQuestion(FIXED_THREE_SUM_QUESTION);
    setTestCases(getDefaultThreeSumTestCases());
    setCurrentTestIndex(0);
    setTestResults([]);
    setSubmissionStatus(null);
    setAgentText(`"Connecting to AI Interviewer..."`);

    void startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewKey]);

  async function startInterview() {
    // Send an initial empty message to trigger the agent's greeting
    await sendMessageToAgent("Hello, I am ready for the interview.", true);
  }

  async function sendMessageToAgent(content: string, isSystemInit = false) {
    if (!content.trim()) return;

    setIsAgentLoading(true);
    const newMessages = isSystemInit ? [] : [...messages, { role: 'user', content }];
    setMessages(newMessages);
    if (!isSystemInit) setUserInput("");

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          state: interviewState,
          currentQuestion: currentQuestion ?? FIXED_THREE_SUM_QUESTION,
          code: editorValue, // Send current code to agent
          company,
          topic,
          excludeTopics, // Pass exclusions to API
          difficulty: 'Medium' // Default for now
        })
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const detail = typeof data?.detail === "string" ? ` ${data.detail}` : "";
        const retry = typeof data?.retryAfterSeconds === "number" ? ` Retry in ${data.retryAfterSeconds}s.` : "";
        const msg = typeof data?.error === "string" ? data.error : `Agent API error (${res.status})`;
        const combined = `${msg}.${detail}${retry}`.trim();
        setAgentText(`"${combined}"`);
        setMessages((prev) => [...prev, { role: 'model', content: combined }]);
        return;
      }

      if (data.message) {
        setAgentText(`"${data.message}"`);
        setMessages(prev => [...prev, { role: 'model', content: data.message }]);
      }

      if (data.newQuestion) {
        setCurrentQuestion(data.newQuestion);
        if (data.newQuestion.examples) {
          const cases = (data.newQuestion.examples || []).slice(0, 3).map((e: any) => ({
            input: String(e.input ?? ""),
            expected: String(e.output ?? e.expected ?? ""),
            custom: false
          }));
          setTestCases(cases);
        }
      }

      if (data.nextState && data.nextState !== interviewState) {
        setInterviewState(data.nextState);
        if (data.nextState === 'coding') {
          setUnlocked(true);
          setAgentText(`"${data.message || "Editor unlocked. Good luck!"}"`);
        }
      }

    } catch (err) {
      console.error("Agent Error", err);
      setAgentText("\"Connection error. Please check your API key and try again.\"");
      setMessages(prev => [...prev, { role: 'model', content: "Connection error. Please check your API key and try again." }]);
    } finally {
      setIsAgentLoading(false);
    }
  }


  // Create a session record when the interview starts.
  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;
    sessionIdRef.current = null;
    startedAtMsRef.current = Date.now();

    async function createSessionRow() {
      try {
        if (!supabase) return;

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!userRes.user) return;

        const stableId = getOrCreateStableSessionId(company, topic, duration);
        const startedAtIso = new Date().toISOString();
        sessionIdRef.current = stableId;

        const { data, error } = await supabase
          .from("interview_sessions")
          .upsert(
            {
              id: stableId,
              company,
              topic,
              exclude_topics: (excludeTopics ?? []).filter(Boolean),
              duration_minutes: duration,
              started_at: startedAtIso,
              ended_at: null,
              elapsed_seconds: 0,
              agent_score: 8,
            },
            { onConflict: "id" }
          )
          .select("id")
          .single();

        if (error) throw error;
        if (!cancelled) sessionIdRef.current = (data as any)?.id ?? stableId;
      } catch (e) {
        console.warn("Failed to create interview session row", e);
      }
    }

    createSessionRow();

    return () => {
      cancelled = true;
      // Best-effort save on unmount. Avoid ending instantly (StrictMode dev remounts).
      void finishSessionRow({ force: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, topic, duration, excludeTopics]);

  useEffect(() => {
    const t = setInterval(() => setTimerSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Ensure timer is set to the chosen interview duration when the component mounts
  // or when the duration prop changes. This guarantees the countdown begins
  // immediately for the full interview time chosen in the SetupModal.
  useEffect(() => {
    setTimerSeconds(duration * 60);
  }, [duration]);

  async function finishSessionRow(opts?: { force?: boolean }) {
    try {
      if (endedRef.current) return;
      if (!supabase) return;
      const id = sessionIdRef.current;
      if (!id) return;

      const elapsed = Math.min(
        duration * 60,
        Math.max(0, Math.floor((Date.now() - startedAtMsRef.current) / 1000))
      );

      // React StrictMode (dev) mounts/unmounts immediately which would otherwise
      // mark a session ended with 0s elapsed. Skip ultra-fast unmounts.
      if (!opts?.force && elapsed < 3) return;

      endedRef.current = true;

      await supabase
        .from("interview_sessions")
        .update({
          ended_at: new Date().toISOString(),
          elapsed_seconds: elapsed,
          agent_score: 8,
        })
        .eq("id", id);

      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn("Failed to finish interview session row", e);
    }
  }

  async function handleEndSession() {
    await finishSessionRow({ force: true });
    onEnd?.();
  }

  function simulateUnlock() {
    setAgentText("Analyzing approach... Logic seems sound. Unlocking editor.");
    setListening(false);
    setTimeout(() => {
      setUnlocked(true);
      setAgentText(`Editor unlocked. You have ${duration} minutes to implement the solution.`);
      // Focus Monaco editor when unlocked
      try {
        editorRef.current?.focus?.();
      } catch (e) {
        // ignore
      }
    }, 1200);
  }

  function formatTimer() {
    const hrs = Math.floor(timerSeconds / 3600);
    const mins = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function normalizeOutput(s: string | undefined) {
    if (s == null) return "";
    return String(s).replace(/\r\n/g, "\n").trim().replace(/\s+/g, " ");
  }

  async function runTests(useJudge: boolean) {
    setTestResults([]);
    const results: any[] = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const url = useJudge ? '/api/judge0' : '/api/run';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: editorValue, language, stdin: tc.input }),
        });
        const data = await res.json().catch(() => ({} as any));
        
        // Check for compilation errors
        const compileOutput = data?.compileStderr ?? data?.compile_output ?? data?.compileOutput;
        const diagnosticsFromResp = data?.errors ?? data?.diagnostics;
        
        if (compileOutput || (Array.isArray(diagnosticsFromResp) && diagnosticsFromResp.length > 0)) {
          const errMsg = compileOutput ?? (Array.isArray(diagnosticsFromResp) ? diagnosticsFromResp.map((d: any) => d.message ?? JSON.stringify(d)).join('\n') : (data?.error ?? `Run failed (${res.status})`));
          setDiagnostics(Array.isArray(diagnosticsFromResp) ? diagnosticsFromResp : []);
          setSubmissionStatus("compile");
          setConsoleOutput(String(errMsg));
          setConsoleVisible(true);
          setActiveBottomTab("result");
          return; // stop running further tests
        }

        if (!res.ok || data?.ok === false) {
          const err = data?.error ?? data?.stderr ?? `Run failed (${res.status})`;
          results.push({ input: tc.input, expected: tc.expected, output: undefined, passed: false, error: String(err) });
          setTestResults([...results]);
          continue;
        }

        const out = normalizeOutput(data.stdout ?? data.runStdout ?? data.stderr ?? "");
        const expect = normalizeOutput(tc.expected);
        const passed = out === expect;
        results.push({ input: tc.input, expected: tc.expected, output: out, passed, error: undefined });
        setTestResults([...results]);
      } catch (e) {
        results.push({ input: tc.input, expected: tc.expected, output: undefined, passed: false, error: String(e) });
        setTestResults([...results]);
      }
    }

    const passedCount = results.filter(r => r.passed).length;
    if (passedCount === results.length) {
      setSubmissionStatus("accepted");
    } else {
      setSubmissionStatus("wrong");
    }

    setActiveBottomTab("result");
    const summary = passedCount === results.length ? "All cases passed!" : `Passed ${passedCount} out of ${results.length} cases.`;
    const detail = results.map((r, idx) => {
      return `Case ${idx + 1}: ${r.passed ? 'PASS' : 'FAIL'}${!r.passed ? ` (Expected "${r.expected}", Got "${r.output ?? r.error}")` : ''}`;
    }).join("\n");
    setConsoleOutput(`${summary}\n\n${detail}`);
    setConsoleVisible(true);
  }

  async function runCase(useJudge: boolean) {
    const idx = currentTestIndex;
    if (idx < 0 || idx >= testCases.length) return;
    const tc = testCases[idx];
    try {
      const url = useJudge ? '/api/judge0' : '/api/run';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editorValue, language, stdin: tc.input }),
      });
      const data = await res.json().catch(() => ({} as any));
      
      const compileOutput = data?.compileStderr ?? data?.compile_output ?? data?.compileOutput;
      const diagnosticsFromResp = data?.errors ?? data?.diagnostics;
      
      if (compileOutput || (Array.isArray(diagnosticsFromResp) && diagnosticsFromResp.length > 0)) {
        const errMsg = compileOutput ?? (Array.isArray(diagnosticsFromResp) ? diagnosticsFromResp.map((d: any) => d.message ?? JSON.stringify(d)).join('\n') : (data?.error ?? `Run failed (${res.status})`));
        setDiagnostics(Array.isArray(diagnosticsFromResp) ? diagnosticsFromResp : []);
        setSubmissionStatus("compile");
        setConsoleOutput(String(errMsg));
        setConsoleVisible(true);
        setActiveBottomTab("result");
        return;
      }

      if (!res.ok || data?.ok === false) {
        const err = data?.error ?? data?.stderr ?? `Run failed (${res.status})`;
        const r = { input: tc.input, expected: tc.expected, output: undefined, passed: false, error: String(err) };
        const next = [...testResults];
        while (next.length <= idx) next.push(undefined as any); 
        next[idx] = r; 
        setTestResults(next);
        setConsoleOutput(String(err)); 
        setConsoleVisible(true);
        setActiveBottomTab("result");
        return;
      }
      
      const out = normalizeOutput(data.stdout ?? data.runStdout ?? data.compileStderr ?? data.stderr ?? '');
      const expect = normalizeOutput(tc.expected);
      const passed = out === expect;
      const r = { input: tc.input, expected: tc.expected, output: out, passed, error: undefined };
      const next = [...testResults]; 
      while (next.length <= idx) next.push(undefined as any);
      next[idx] = r; 
      setTestResults(next);
      setConsoleOutput(`${passed ? 'PASS' : 'FAIL'}\n\nInput: ${tc.input}\nExpected: ${tc.expected}\nOutput: ${out}`);
      setConsoleVisible(true);
      setActiveBottomTab("result");
    } catch (e) {
      const r = { input: tc.input, expected: tc.expected, output: undefined, passed: false, error: String(e) };
      const next = [...testResults]; 
      while (next.length <= idx) next.push(undefined as any);
      next[idx] = r; 
      setTestResults(next);
      setConsoleOutput(String(e)); 
      setConsoleVisible(true);
      setActiveBottomTab("result");
    }
  }

  async function runWithJudge0() {
    if (testCases && testCases.length > 0) {
      await runTests(true);
      return;
    }

    try {
      setIsRunning(true);
      const res = await fetch('/api/judge0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editorValue, language, stdin: customInput }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.ok === false) {
        const errs = data?.errors ?? (data?.error ? [{ line: 0, column: 0, message: data.error }] : []);
        const formatted = errs.map((e: any) => `Line ${e.line}${e.column ? `:${e.column}` : ""} - ${e.message}`).join("\n");
        const fallback = data?.compileStderr ?? data?.stderr ?? data?.error ?? `Run failed (${res.status})`;
        setDiagnostics(errs ?? []);
        setConsoleOutput(formatted || fallback);
        setConsoleVisible(true);
        return;
      }

      const out = data.stdout ?? data.compileStderr ?? data.stderr ?? "Run completed.";
      setDiagnostics([]);
      setConsoleOutput(out);
      setConsoleVisible(true);
    } catch (e) {
      console.error(e);
      setConsoleOutput(`Error: ${String(e)}`);
      setConsoleVisible(true);
    } finally {
      setIsRunning(false);
    }
  }

  async function submitSolution() {
    try {
      setIsRunning(true);
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorValue, language, sessionId: sessionIdRef.current, stdin: customInput }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.ok === false) {
        const errs = data?.errors ?? (data?.error ? [{ line: 0, column: 0, message: data.error }] : []);
        setDiagnostics(errs ?? []);
        const formatted = errs.map((e: any) => `Line ${e.line}${e.column ? `:${e.column}` : ""} - ${e.message}`).join("\n");
        const fallback = data?.compileStderr ?? data?.stderr ?? data?.error ?? `Submit failed (${res.status})`;
        setConsoleOutput(formatted || fallback);
        setConsoleVisible(true);
        return;
      }

      setDiagnostics([]);
      const success = data.result ?? data.details ?? "Submit successful (mock).";
      const out = data.stdout ?? data.compileStderr ?? data.stderr ?? "";
      setConsoleOutput(success + (out ? `\n${out}` : ""));
      setConsoleVisible(true);
    } catch (e) {
      console.error(e);
      setConsoleOutput(`Error: ${String(e)}`);
      setConsoleVisible(true);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[35%] flex flex-col border-r border-white/5 bg-slate-900/30">
          <div className="h-64 border-b border-white/5 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
                <span className="text-xs font-bold text-blue-400 tracking-wider">AI AGENT ACTIVE</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">STATUS: {listening ? 'LISTENING' : 'READY'}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div id="voice-viz" className={`flex items-center gap-1 h-12 mb-4 ${listening ? 'speaking' : ''}`}>
                <div className="wave-bar" style={{ animationDelay: '0.0s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.2s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.3s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
              </div>
              <p id="agent-text" className="text-center text-sm text-slate-200 font-medium leading-relaxed">{agentText}</p>
            </div>

            <div className="mt-4 flex gap-2 justify-center">
              <button id="mic-btn" className={`w-10 h-10 rounded-full ${listening ? 'bg-blue-600' : 'bg-slate-700'} hover:bg-blue-500 flex items-center justify-center transition shadow-lg shadow-blue-500/20`} onClick={() => setListening((s) => !s)}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              </button>
              <button onClick={simulateUnlock} disabled={unlocked} className={`px-4 py-2 rounded-full border border-white/10 text-xs font-semibold hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed`}>I'm Ready to Code</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="mb-4">
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">{currentQuestion?.difficulty || "Loading..."}</span>
              <span className="text-xs font-bold text-slate-400 ml-2">{topic}</span>
            </div>
            {(excludeTopics ?? []).length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Excluding</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(excludeTopics ?? []).map((t) => (
                    <span key={t} className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/40 text-xs text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion ? (
              <>
                <h2 className="text-xl font-bold mb-4">{currentQuestion.title}</h2>
                <div className="prose prose-invert prose-sm text-slate-300">
                  <p>{currentQuestion.description || currentQuestion.prompt}</p>

                  {currentQuestion.examples && Array.isArray(currentQuestion.examples) && currentQuestion.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-white/5 my-4">
                      <p className="font-mono text-xs text-slate-400 mb-1">Example {i + 1}:</p>
                      <p className="font-mono text-sm mb-2">Input: {ex.input}</p>
                      <p className="font-mono text-sm">Output: {ex.output}</p>
                    </div>
                  ))}

                  {currentQuestion.constraints && (
                    <>
                      <p><strong>Constraints:</strong></p>
                      <div className="pl-4 space-y-1 font-mono text-xs">
                        {currentQuestion.constraints}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <p>Waiting for interviewer to assign a question...</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-slate-900/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageToAgent(userInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                disabled={isAgentLoading}
              />
              <button
                type="submit"
                disabled={isAgentLoading || !userInput.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#1e1e1e] relative">
          <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between pl-4 pr-4 select-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">solution.cpp</div>
            </div>
            <div className="flex items-center gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent text-xs text-slate-400 focus:outline-none border-none cursor-pointer">
                <option>C++ 17</option>
                <option>C++ 20</option>
                <option>Java</option>
                <option>Python 3</option>
              </select>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                <div className={`w-2 h-2 rounded-full ${listening ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <span className="text-xs font-mono text-slate-300">{formatTimer()}</span>
              </div>
              <button
                className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-red-500/20 transition"
                onClick={handleEndSession}
              >
                End Session
              </button>
            </div>
          </div>

          <div className="flex-1 relative pb-[340px]" style={{ minHeight: 0 }}>
            <div className="absolute inset-0 w-full h-full flex">
              <div style={{ flex: 1, position: 'relative' }} className="editor-area">
                <Editor
                  height="100%"
                  defaultLanguage="cpp"
                  language={useMemo(() => {
                    if (language.toLowerCase().includes('c++')) return 'cpp';
                    if (language.toLowerCase().includes('java')) return 'java';
                    if (language.toLowerCase().includes('python')) return 'python';
                    return 'plaintext';
                  }, [language])}
                  theme="vs-dark"
                  value={editorValue}
                  onChange={(val) => setEditorValue(val ?? '')}
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: !unlocked,
                    tabSize: 2,
                  }}
                  onMount={(editorInstance) => { editorRef.current = editorInstance; }}
                />
              </div>
            </div>

            <div className={`logic-lock-overlay ${unlocked ? 'hidden' : ''}`}>
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Editor Locked</h3>
              <p className="text-sm text-slate-400 max-w-xs text-center">Please explain your approach to the AI Agent to unlock the coding environment.</p>
            </div>
          </div>

          <div className="absolute left-0 right-0 bottom-12 bg-[#1e1e1e] border-t border-[#333]">
            <div className="flex items-center gap-6 px-4 py-2 border-b border-[#333] text-sm">
              <button
                onClick={() => setActiveBottomTab("testcase")}
                className={`${activeBottomTab === "testcase" ? "text-green-400" : "text-slate-400"}`}
              >
                Testcase
              </button>
              <button
                onClick={() => setActiveBottomTab("result")}
                className={`${activeBottomTab === "result" ? "text-green-400" : "text-slate-400"}`}
              >
                Test Result
              </button>
            </div>

            <div className="p-4 max-h-[300px] overflow-auto">
              {activeBottomTab === "testcase" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {testCases.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentTestIndex(i)}
                          className={`px-3 py-1 text-xs rounded ${currentTestIndex === i ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400"}`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const next = [...testCases, { input: "", expected: "", custom: true }];
                          setTestCases(next);
                          setCurrentTestIndex(next.length - 1);
                        }}
                        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => runCase(false)}
                        className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        Run Case
                      </button>
                      <button
                        onClick={() => runTests(false)}
                        className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        Run All
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">Input</div>
                    {testCases[currentTestIndex]?.custom ? (
                      <textarea
                        value={testCases[currentTestIndex]?.input || ""}
                        onChange={(e) => {
                          const next = [...testCases];
                          next[currentTestIndex] = { ...next[currentTestIndex], input: e.target.value };
                          setTestCases(next);
                        }}
                        className="w-full bg-slate-800 p-2 text-xs text-white rounded resize-none"
                        rows={3}
                      />
                    ) : (
                      <div className="bg-slate-800 p-3 rounded text-sm text-white">
                        {testCases[currentTestIndex]?.input}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Expected</div>
                    {testCases[currentTestIndex]?.custom ? (
                      <textarea
                        value={testCases[currentTestIndex]?.expected || ""}
                        onChange={(e) => {
                          const next = [...testCases];
                          next[currentTestIndex] = { ...next[currentTestIndex], expected: e.target.value };
                          setTestCases(next);
                        }}
                        className="w-full bg-slate-800 p-2 text-xs text-white rounded resize-none"
                        rows={2}
                      />
                    ) : (
                      <div className="bg-slate-800 p-3 rounded text-sm text-white">
                        {testCases[currentTestIndex]?.expected}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeBottomTab === "result" && (
                <div className="flex flex-col gap-4">
                  <div>
                    {submissionStatus === "compile" && <div className="text-red-400 text-lg font-bold">Compile Error</div>}
                    {submissionStatus === "wrong" && <div className="text-red-400 text-lg font-bold">Wrong Answer</div>}
                    {submissionStatus === "accepted" && <div className="text-green-400 text-lg font-bold">Accepted</div>}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {submissionStatus === "compile" ? (
                      <pre className="bg-slate-900 p-3 rounded text-xs whitespace-pre-wrap text-red-300 border border-red-500/10">
                        {consoleOutput}
                      </pre>
                    ) : testResults.length > 0 ? (
                      testResults.map((res, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border border-white/5">
                          <div className={`w-2 h-2 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-semibold text-slate-300">Case {i + 1}</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {res.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <pre className="bg-slate-900 p-3 rounded text-xs whitespace-pre-wrap text-white border border-white/5">
                        {consoleOutput}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-12 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3"></div>
            <div className="flex items-center gap-3">
              <button onClick={runWithJudge0} className="px-4 py-1.5 rounded text-xs font-semibold text-slate-300 hover:bg-white/5 border border-transparent transition">Run</button>
              <button onClick={submitSolution} className="px-4 py-1.5 rounded text-xs font-semibold bg-green-600 text-white hover:bg-green-500 transition shadow-lg shadow-green-500/10">Submit</button>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .wave-bar {
          width: 3px;
          height: 100%;
          background: #3b82f6;
          border-radius: 2px;
          animation: dance 1s ease-in-out infinite;
        }
        @keyframes dance {
          0%, 100% { height: 10%; }
          50% { height: 100%; }
        }
        .speaking .wave-bar {
          animation-duration: 0.5s;
        }
        :global(.logic-lock-overlay) {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          z-index: 40;
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(4px);
        }
        :global(.logic-lock-overlay.hidden) { display: none; }
      `}</style>
    </div>
  );
}
