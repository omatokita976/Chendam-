"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Msg } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";

type Row = { id: string; name: string; photo_url: string | null; last: string; unread: number; started: boolean };
const LABEL = { image: "📷 Photo", video: "🎥 Vidéo", audio: "🎤 Message vocal" };

export default function Messages() {
  const me = useMe();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    // 1. Les conversations déjà commencées
    const { data } = await supabase.from("messages").select("*")
      .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
      .order("created_at", { ascending: false }).limit(300);
    const by = new Map<string, { last: Msg; unread: number }>();
    ((data as Msg[]) ?? []).forEach((m) => {
      const o = m.sender_id === me.id ? m.receiver_id : m.sender_id;
      const e = by.get(o) ?? { last: m, unread: 0 };
      if (m.receiver_id === me.id && !m.read_at) e.unread++;
      by.set(o, e);
    });
    const order = [...by.keys()]; // du plus récent au plus ancien

    // 2. Tous mes amis, pour pouvoir écrire à chacun
    const { data: fs } = await supabase.from("friendships").select("requester,addressee")
      .eq("status", "accepted").or(`requester.eq.${me.id},addressee.eq.${me.id}`);
    const friends = (fs ?? []).map((f: any) => (f.requester === me.id ? f.addressee : f.requester));

    const ids = [...new Set([...order, ...friends])];
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id,name,photo_url").in("id", ids) : { data: [] };
    const list: Row[] = (ps ?? []).map((p: any) => {
      const e = by.get(p.id);
      return {
        id: p.id, name: p.name, photo_url: p.photo_url, started: !!e, unread: e?.unread ?? 0,
        last: e ? (e.last.body || (e.last.media_type ? LABEL[e.last.media_type] : "")) : "Vous êtes amis : dis bonjour 👋",
      };
    });
    const rank = (r: Row) => (r.started ? order.indexOf(r.id) : 1000);
    list.sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || rank(a) - rank(b) || a.name.localeCompare(b.name));
    setRows(list);
    setLoaded(true);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    load();
    const ch = supabase.channel("inbox").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, load]);
  if (!me) return null;

  return (
    <Shell me={me}>
      <h2 style={{ marginBottom: 12 }}>Messages</h2>
      {loaded && rows.length === 0 && (
        <div className="card">
          Aucune conversation pour le moment. Ajoute des amis dans l&apos;onglet <Link href="/amis" className="ghost-link">Amis</Link>, ou touche « Écrire au vendeur » sur un article.
        </div>
      )}
      {rows.map((r) => (
        <Link key={r.id} href={`/messages/${r.id}`} className="card convo">
          <Av name={r.name} url={r.photo_url} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{r.name}</strong>
            <div className="meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.last}</div>
          </div>
          {r.unread > 0 ? <span className="badge">{r.unread}</span> : !r.started && <span className="tag">Ami</span>}
        </Link>
      ))}
    </Shell>
  );
        }
      
