"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, fcfa } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import { relWith, countFriends, plural, type Rel } from "@/lib/friends";
import Shell, { Av } from "@/components/Shell";
import ReportButton from "@/components/ReportButton";
import AdultImage from "@/components/AdultImage";

type Item = { id: number; title: string; price_fcfa: number; photo_urls: string[]; adult: boolean };

export default function PublicProfile() {
  const me = useMe();
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<{ name: string; ville: string | null; photo_url: string | null } | null>(null);
  const [nf, setNf] = useState(0);
  const [rel, setRel] = useState<Rel>(null);
  const [items, setItems] = useState<Item[]>([]);

  const reload = useCallback(async () => {
    if (!me) return;
    setNf(await countFriends(id));
    setRel(await relWith(me.id, id));
  }, [me, id]);

  useEffect(() => {
    if (!me) return;
    supabase.from("profiles").select("name,ville,photo_url").eq("id", id).single().then(({ data }) => setP(data));
    supabase.from("posts").select("id,title,price_fcfa,photo_urls,adult").eq("seller_id", id).eq("status", "active")
      .order("created_at", { ascending: false }).then(({ data }) => setItems((data as Item[]) ?? []));
    reload();
  }, [me, id, reload]);
  if (!me) return null;

  const act = async (k: "add" | "accept" | "refuse" | "remove") => {
    if (k === "add") await supabase.from("friendships").insert({ requester: me.id, addressee: id });
    if (k === "accept") await supabase.from("friendships").update({ status: "accepted" }).eq("id", rel!.id);
    if (k === "refuse") await supabase.from("friendships").update({ status: "declined" }).eq("id", rel!.id);
    if (k === "remove") await supabase.from("friendships").delete().eq("id", rel!.id);
    reload();
  };

  let btns = null;
  if (me.id !== id) {
    if (!rel) btns = <button onClick={() => act("add")}>Ajouter en ami</button>;
    else if (rel.status === "accepted") btns = <><span className="meta">Amis ✓</span><button className="ghost" onClick={() => act("remove")}>Retirer</button></>;
    else if (rel.mine) btns = <><span className="meta">Invitation envoyée</span><button className="ghost" onClick={() => act("remove")}>Annuler</button></>;
    else btns = <><button onClick={() => act("accept")}>Accepter</button>{rel.status === "pending" && <button className="ghost" onClick={() => act("refuse")}>Refuser</button>}</>;
  }

  return (
    <Shell me={me}>
      <div className="card">
        <div className="row"><Av name={p?.name ?? "?"} url={p?.photo_url} big />
          <div><h2>{p?.name}</h2><div className="meta">{p?.ville}</div><strong>{plural(nf)}</strong></div>
        </div>
        {me.id !== id && (
          <p className="row" style={{ flexWrap: "wrap" }}>{btns}<Link className="ghost-link" href={`/messages/${id}`}>Écrire</Link></p>
        )}
        {me.id !== id && <ReportButton meId={me.id} userId={id} />}
      </div>
      <h3 style={{ margin: "18px 0 10px" }}>Articles en vente ({items.length})</h3>
      {items.length === 0 ? <div className="card meta">Aucun article en vente.</div> : (
        <div className="grid2">
          {items.map((i) => (
            <div key={i.id}><AdultImage adult={i.adult} alt={i.title} src={i.photo_urls[0]} /><div><strong>{i.title}</strong></div><span className="price">{fcfa(i.price_fcfa)}</span></div>
          ))}
        </div>
      )}
    </Shell>
  );
}
