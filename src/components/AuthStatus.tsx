"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function AuthStatus() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase!.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    }

    load();

    const { data: listener } = supabase!.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {user ? (
        <>
          <Link href="/account">
            <span style={{ fontSize: 14, color: "#222" }}>{user.email}</span>
          </Link>
          <button onClick={handleSignOut}>Sign out</button>
        </>
      ) : null}
    </div>
  );
}
