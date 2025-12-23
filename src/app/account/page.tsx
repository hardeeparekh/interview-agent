"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase!.auth.getSession();
      if (!mounted) return;
      setUserEmail(data.session?.user?.email ?? null);
    }

    load();

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
    // send user home after sign-out
    router.push("/");
  };

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: 420, padding: 28 }} className="glass-card rounded-2xl">
        <h2 style={{ marginBottom: 8 }} className="text-xl font-bold">Account</h2>
        <div style={{ color: "#94a3b8", marginBottom: 16 }}>
          {userEmail ? (
            <>
              Signed in as <strong style={{ color: "#fff" }}>{userEmail}</strong>
            </>
          ) : (
            <span>Not signed in</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSignOut} className="glow-button bg-blue-600 px-4 py-2 rounded-md text-white">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
