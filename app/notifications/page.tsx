"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";
import EnablePush from "@/components/EnablePush";

type N = {
  id: number; type: "like" | "comment" | "friend_request" | "message" | "order"; actor_id: string;
  read_at: string | null; created_at: string;
  actor: { name: string; photo_url: string | null }; posts: { title: string } | null;
};

export default function Notifications() {
  const me = useMe();
  const [rows, setRows] = useState<N[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    const { data } = await supabase.from("notifications")
      .select("*, actor:profiles!actor_id(name,photo_url), posts(title)")
      .eq("user_id", me.id).order("created_at", { ascending: false }).limit(60);
    setRows((data as any) ?? []);
    setLoaded(true);
    // ouvrir la page = tout est vu (les lignes restent surlignées pendant cette visite)
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", me.id).is("read_at", null);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    load();
    const ch = supabase.channel("notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, load]);
  if (!me) return null;

  const text = (n: N) => {
    const who = <strong>{n.actor.name}</strong>;
    const title = n.posts ? <> « {n.posts.title} »</> : null;
    if (n.type === "like") return <>{who} a aimé ton article{title}</>;
    if (n.type === "comment") return <>{who} a commenté ton article{title}</>;
    if (n.type === "order") return <>{who} a acheté ton article{title}</>;
    if (n.type === "friend_request") return <>{who} t&apos;a envoyé une demande d&apos;ami</>;
    return <>{who} t&apos;a envoyé un message</>;
  };
  const href = (n: N) =>
    n.type === "message" ? `/messages/${n.actor_id}` : n.type === "friend_request" ? "/amis" : n.type === "order" ? "/commandes" : `/profil/${me.id}`;

  return (
    <Shell me={me}>
      <h2 style={{ marginBottom: 12 }}>Notifications</h2>
      <EnablePush />
      {loaded && rows.length === 0 && <div className="card">Rien pour le moment. Tu verras ici les messages, demandes d&apos;amis, j&apos;aime et commentaires.</div>}
      {rows.map((n) => (
        <Link key={n.id} href={href(n)} className="card convo" style={n.read_at ? undefined : { borderLeft: "5px solid var(--g)" }}>
          <Av name={n.actor.name} url={n.actor.photo_url} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>{text(n)}</div>
            <div className="meta">{new Date(n.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </Link>
      ))}
    </Shell>
  );
}
