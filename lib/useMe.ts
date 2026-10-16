"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export type Me = { id: string; name: string; ville: string | null; photo_url: string | null; role: string; is_banned: boolean };

// Gardé en mémoire : en changeant de page, l'écran s'affiche tout de suite
let cache: Me | null = null;
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") cache = null; });
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(cache);
  const router = useRouter();
  useEffect(() => {
    let on = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) { cache = null; router.replace("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      if (on && p) { cache = p as Me; setMe(cache); }
    });
    return () => { on = false; };
  }, [router]);
  return me;
}
