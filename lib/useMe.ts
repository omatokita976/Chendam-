"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export type Me = { id: string; name: string; ville: string | null; photo_url: string | null; role: string; is_banned: boolean };

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) { router.replace("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      setMe(p as Me);
    });
  }, [router]);
  return me;
}
