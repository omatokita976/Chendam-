"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export type Me = { id: string; name: string; ville: string | null; photo_url: string | null; role: string; is_banned: boolean };

// Gardé en mémoire : en changeant de page, l'écran s'affiche tout de suite
let cache: Me | null = null;
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      cache = null;
      if (!window.location.pathname.startsWith("/login")) window.location.replace("/login");
    }
  });
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useMe() {
  const [me, setMe] = useState<Me | null>(cache);
  const router = useRouter();
  useEffect(() => {
    let on = true;
    (async () => {
      let u = (await supabase.auth.getSession()).data.session?.user;
      if (!u) { await wait(700); u = (await supabase.auth.getSession()).data.session?.user; } // 2e essai
      // Pas de session : on ne renvoie vers la connexion que si on ne connaissait pas déjà la personne
      if (!u) { if (!cache) router.replace("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      if (on && p) { cache = p as Me; setMe(cache); }
    })();
    return () => { on = false; };
  }, [router]);
  return me;
}
