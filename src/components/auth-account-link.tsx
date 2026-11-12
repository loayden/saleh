"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

function getFirstName(user: { user_metadata?: Record<string, unknown> } | null) {
  const value = user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof value === "string" ? value.trim().split(/\s+/)[0] : "";
}

export default function AuthAccountLink({ className = "", showLabel = true }: { className?: string; showLabel?: boolean }) {
  const [firstName, setFirstName] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setFirstName(getFirstName(data.session?.user || null));
        setHasSession(Boolean(data.session));
        setSessionChecked(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setFirstName(getFirstName(session?.user || null));
      setHasSession(Boolean(session));
      setSessionChecked(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const href = sessionChecked && !hasSession ? "/auth?next=%2Faccount" : "/account";
  return <Link className={className} href={href} aria-label="الحساب"><UserRound aria-hidden="true" />{showLabel && <small>{firstName ? `أهلاً ${firstName}` : "حسابي"}</small>}</Link>;
}
