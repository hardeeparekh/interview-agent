"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

// Full-page styled login / signup using the provided design.
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase!.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    }

    loadSession();

    const { data: listener } = supabase!.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    const fullName = name.trim();
    if (!email) {
      setMessage("Email is required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setMessage("Invalid email address.");
      return;
    }
    if (!password) {
      setMessage("Password is required.");
      return;
    }
    if (!fullName) {
      setMessage("Please provide your full name.");
      return;
    }
    if (!supabase) {
      setMessage("Supabase not initialized. Check environment variables.");
      console.error("Supabase client is null");
      return;
    }
    setLoading(true);
    setMessage("");
    console.log("[handleSignUp] Starting signup with email:", email);
    try {
      // store full name in user metadata during sign up
      const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      console.log("[handleSignUp] Response:", { error, data });
      setLoading(false);
      if (error) {
        console.error("[handleSignUp] Error:", error);
        setMessage(error.message || "Sign up failed");
      } else {
        try {
          if ((data as any)?.session) {
            await supabase.auth.updateUser({ data: { full_name: fullName } });
          }
        } catch (err) {
          console.warn("Could not update user metadata after signUp", err);
        }

        if ((data as any)?.session) {
          router.push("/account");
        } else {
          setMessage("Check your email for a confirmation link (if enabled). If you already have an account, try signing in.");
        }
      }
    } catch (err) {
      setLoading(false);
      console.error("[handleSignUp] Exception:", err);
      setMessage(String((err as any)?.message ?? err));
    }
  };

  const handleSignIn = async () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) {
      setMessage("Email is required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setMessage("Invalid email address.");
      return;
    }
    if (!password) {
      setMessage("Password is required.");
      return;
    }
    if (!supabase) {
      setMessage("Supabase not initialized. Check environment variables.");
      console.error("Supabase client is null");
      return;
    }
    setLoading(true);
    setMessage("");
    console.log("[handleSignIn] Starting signin with email:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("[handleSignIn] Response:", { data, error });
      setLoading(false);
      if (error) {
        console.error("[handleSignIn] Error:", error);
        setMessage(error.message || "Sign in failed");
      } else {
        console.log("[handleSignIn] Sign in successful, redirecting to /account");
          router.push("/account");
      }
    } catch (err) {
      setLoading(false);
      console.error("[handleSignIn] Exception:", err);
      setMessage(String((err as any)?.message ?? err));
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setLoading(true);
    setMessage("");
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/account` : undefined;
      const { error } = await supabase!.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) setMessage(error.message);
    } catch (err: any) {
      setMessage(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-courier min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="hidden md:block rounded-2xl glass-card p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            POWERED BY AGENTIC INTELLIGENCE
          </div>
          <h2 className="text-3xl font-extrabold mb-4">{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
          <p className="text-slate-400 mb-6">{mode === "login" ? "Enter your credentials to access your sessions." : "Start your first mock interview in seconds."}</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold">Features</h4>
              <ul className="text-slate-400 text-sm list-inside list-disc">
                <li>Company-targeted rounds</li>
                <li>Vocal logic verification</li>
                <li>Deep result analysis</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl">
          <div className="flex gap-6 mb-6 border-b border-white/5">
            <button onClick={() => setMode("login")} className={`pb-2 text-sm font-bold uppercase tracking-wider ${mode === "login" ? "tab-active" : "text-slate-500"}`}>Log In</button>
            <button onClick={() => setMode("signup")} className={`pb-2 text-sm font-bold uppercase tracking-wider ${mode === "signup" ? "tab-active" : "text-slate-500"}`}>Sign Up</button>
          </div>

          <h3 className="text-2xl font-bold mb-2">{mode === "login" ? "Welcome Back" : "Create Account"}</h3>
          <p className="text-slate-400 text-sm mb-6">{mode === "login" ? "Enter your credentials to access your sessions." : "Start your first mock interview in seconds."}</p>

          <div className="space-y-3">
            <button onClick={() => handleOAuthSignIn("google")} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.065-1.54-.18-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.97-1.09 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.81-2.13-6.76-4.99H1.4v3.12C3.37 21.31 7.42 24 12 24z"/><path fill="#FBBC05" d="M5.24 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.62H1.4C.51 8.41 0 10.15 0 12s.51 3.59 1.4 5.38l3.84-2.92a7.96 7.96 0 0 1-.38-2.2z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.37 2.69 1.4 6.62L5.24 9.54c.95-2.86 3.61-4.99 6.76-4.99z"/></svg>
              Continue with Google
            </button>

            {/* GitHub OAuth temporarily disabled */}
            {/**
            <button onClick={() => handleOAuthSignIn("github")} className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              Continue with GitHub
            </button>
            */}
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-3 text-xs text-slate-500 uppercase font-bold">or email</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" className="w-full bg-slate-900 border border-white/10 text-white p-3 px-4 rounded-xl focus:outline-none focus:border-blue-500 transition" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full bg-slate-900 border border-white/10 text-white p-3 px-4 rounded-xl focus:outline-none focus:border-blue-500 transition" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-slate-900 border border-white/10 text-white p-3 px-4 rounded-xl focus:outline-none focus:border-blue-500 transition" />
            <div className="flex gap-3">
              {mode === "login" ? (
                <button onClick={handleSignIn} className="w-full glow-button bg-blue-600 text-white font-bold py-3 rounded-xl mt-2" disabled={loading}>Sign in</button>
              ) : (
                <button onClick={handleSignUp} className="w-full glow-button bg-blue-600 text-white font-bold py-3 rounded-xl mt-2" disabled={loading}>Sign up</button>
              )}
            </div>
            {message && <p className="text-sm text-yellow-300 mt-2">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
