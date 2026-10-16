"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Me } from "@/lib/useMe";
import Marquee from "./Marquee";

export function Av({ name, url, big }: { name: string; url?: string | null; big?: boolean }) {
  return <div className={"av" + (big ? " big" : "")}>{url ? <img alt="" src={url} /> : name.charAt(0).toUpperCase()}</div>;
}

export default function Shell({ me, children }: { me: Me; children: React.ReactNode }) {
  const path = usePathname();
  const [n, setN] = useState(0); // nombre de personnes qui t'ont écrit sans que tu aies lu
  const [inv, setInv] = useState(0); // invitations d'amis en attente
  const [nn, setNn] = useState(0); // notifications non lues

  useEffect(() => {
    const count = async () => {
      const { data } = await supabase.from("messages").select("sender_id").eq("receiver_id", me.id).is("read_at", null);
      setN(new Set((data ?? []).map((r) => r.sender_id)).size);
      const { count: c } = await supabase.from("friendships").select("id", { count: "exact", head: true }).eq("addressee", me.id).eq("status", "pending");
      setInv(c ?? 0);
      const { count: k } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("read_at", null);
      setNn(k ?? 0);
    };
    count();
    const ch = supabase.channel("badge").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, count)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, count)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, count).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, path]);

  const tab = (href: string, label: React.ReactNode) => {
    const on = href === "/" ? path === "/" : path.startsWith(href);
    return <Link href={href} className={on ? "on" : ""}>{label}</Link>;
  };
  return (
    <>
      <div className="wrap">
        <header className="top">
          <div><div className="logo">Chendam</div><div className="stripe"><i /><i /><i /></div></div>
          <Link href="/notifications" className="bell" aria-label="Notifications">🔔{nn > 0 && <span className="badge">{nn}</span>}</Link>
        </header>
        {me.is_banned && <div className="card err">Ton compte est suspendu : tu ne peux plus publier ni commenter.</div>}
        {children}
      </div>
      <nav>
      {path === "/" && <Marquee />}
      <div>
        {tab("/", <><span className="ic">🏠</span>Accueil</>)}
        {tab("/vendre", <><span className="ic">➕</span>Vendre</>)}
        {tab("/amis", <><span className="ic">👥</span>Amis{inv > 0 && <span className="badge">{inv}</span>}</>)}
        {tab("/messages", <><span className="ic">💬</span>Messages{n > 0 && <span className="badge">{n}</span>}</>)}
        {tab("/profil", <><span className="ic">👤</span>Profil</>)}
      </div></nav>
    </>
  );
          }
