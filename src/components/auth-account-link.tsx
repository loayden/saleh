"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

function getFirstName(user: { user_metadata?: Record<string, unknown> } | null) {
  const value = user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof value === "string" ? value.trim().split(/\s+/)[0] : "";
}

export default function AuthAccountLink({ className = "" }: { className?: string }) {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setFirstName(getFirstName(data.session?.user || null));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setFirstName(getFirstName(session?.user || null));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <Link className={className} href="/account" aria-label="الحساب"><UserRound aria-hidden="true" /><small>{firstName ? `أهلاً ${firstName}` : "حسابي"}</small></Link>;
}
