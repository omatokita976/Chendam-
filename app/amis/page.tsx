"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import { plural } from "@/lib/friends";
import Shell, { Av } from "@/components/Shell";

type P = { id: string; name: string; photo_url: string | null; ville: string | null };
type F = { id: number; requester: string; addressee: string; status: string };

export default function Amis() {
  const me = useMe();
  const [fs, setFs] = useState<F[]>([]);
  const [people, setPeople] = useState<Record<string, P>>({});
  const [sug, setSug] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<P[]>([]);

  const load = useCallback(async () => {
    if (!me) return;
    const { data } = await supabase.from("friendships").select("*").or(`requester.eq.${me.id},addressee.eq.${me.id}`);
    const list = (data as F[]) ?? [];
    setFs(list);
    const ids = [...new Set(list.flatMap((f) => [f.requester, f.addressee]))].filter((i) => i !== me.id);
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,name,photo_url,ville").in("id", ids);
      setPeople(Object.fromEntries((ps ?? []).map((x: any) => [x.id, x])));
    }
    const { data: s } = await supabase.rpc("suggest_friends");
    setSug((s as P[]) ?? []);
  }, [me]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!me) return;
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id,name,photo_url,ville")
        .ilike("name", `%${q.trim()}%`).neq("id", me.id).eq("is_banned", false).limit(20);
      setRes((data as P[]) ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, me]);
  if (!me) return null;

  const relOf = (pid: string) => fs.find((f) => f.requester === pid || f.addressee === pid);
  const act = async (k: string, pid: string, f?: F) => {
    if (k === "add") await supabase.from("friendships").insert({ requester: me.id, addressee: pid });
    if (k === "accept") await supabase.from("friendships").update({ status: "accepted" }).eq("id", f!.id);
    if (k === "refuse") await supabase.from("friendships").update({ status: "declined" }).eq("id", f!.id);
    if (k === "cancel") await supabase.from("friendships").delete().eq("id", f!.id);
    load();
  };

  const Row = ({ p }: { p: P }) => {
    const f = relOf(p.id);
    let btns;
    if (!f) btns = <button onClick={() => act("add", p.id)}>Ajouter</button>;
    else if (f.status === "accepted") btns = <span className="meta">Amis ✓</span>;
    else if (f.requester === me.id) btns = <button className="ghost" onClick={() => act("cancel", p.id, f)}>Annuler l&apos;invitation</button>;
    else btns = (<>
      <button onClick={() => act("accept", p.id, f)}>Accepter</button>
      {f.status === "pending" && <button className="ghost" onClick={() => act("refuse", p.id, f)}>Refuser</button>}
    </>);
    return (
      <div className="card row" style={{ flexWrap: "wrap" }}>
        <Link href={`/profil/${p.id}`} className="convo" style={{ flex: 1, minWidth: 140 }}>
          <Av name={p.name} url={p.photo_url} /><div><strong>{p.name}</strong><div className="meta">{p.ville}</div></div>
        </Link>
        {btns}
      </div>
    );
  };

  const invites = fs.filter((f) => f.addressee === me.id && f.status === "pending" && people[f.requester]);
  const friends = fs.filter((f) => f.status === "accepted").map((f) => people[f.requester === me.id ? f.addressee : f.requester]).filter(Boolean);
  const sugg = sug.filter((p) => !relOf(p.id));

  return (
    <Shell me={me}>
      <h2 style={{ marginBottom: 12 }}>Amis</h2>
      <input placeholder="Rechercher quelqu'un par son nom" aria-label="Rechercher une personne" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 2 && (
        <div style={{ marginTop: 12 }}>
          {res.length === 0 ? <div className="card meta">Personne trouvé avec ce nom.</div> : res.map((p) => <Row key={p.id} p={p} />)}
        </div>
      )}
      {invites.length > 0 && (<>
        <h3 style={{ margin: "18px 0 10px" }}>Invitations reçues ({invites.length})</h3>
        {invites.map((f) => <Row key={f.id} p={people[f.requester]} />)}
      </>)}
      {sugg.length > 0 && (<>
        <h3 style={{ margin: "18px 0 10px" }}>Suggestions pour toi</h3>
        {sugg.map((p) => <Row key={p.id} p={p} />)}
      </>)}
      <h3 style={{ margin: "18px 0 10px" }}>Mes amis ({plural(friends.length)})</h3>
      {friends.length === 0 ? <div className="card meta">Tu n&apos;as pas encore d&apos;amis. Cherche quelqu&apos;un ou regarde les suggestions.</div> : friends.map((p) => <Row key={p.id} p={p} />)}
    </Shell>
  );
}
