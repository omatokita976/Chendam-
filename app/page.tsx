"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, fcfa } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";
import Marquee from "@/components/Marquee";
import ReportButton from "@/components/ReportButton";

type Post = {
  id: number; seller_id: string; title: string; price_fcfa: number; etat: string; ville: string | null; photo_urls: string[];
  profiles: { name: string; photo_url: string | null };
  likes: { user_id: string }[];
  comments: { id: number; body: string; profiles: { name: string } }[];
};

export default function Home() {
  const me = useMe();
  const [posts, setPosts] = useState<Post[]>([]);
  const [txt, setTxt] = useState<Record<number, string>>({});

  const load = async () => {
    const { data } = await supabase.from("posts")
      .select("*, profiles(name,photo_url), likes(user_id), comments(id,body,profiles(name))")
      .eq("status", "active").order("created_at", { ascending: false });
    setPosts((data as any) ?? []);
  };
  useEffect(() => { if (me) load(); }, [me]);
  if (!me) return null;

  const like = async (p: Post) => {
    if (p.likes.some((l) => l.user_id === me.id)) await supabase.from("likes").delete().match({ post_id: p.id, user_id: me.id });
    else await supabase.from("likes").insert({ post_id: p.id, user_id: me.id });
    load();
  };
  const send = async (id: number) => {
    const body = (txt[id] || "").trim();
    if (!body) return;
    await supabase.from("comments").insert({ post_id: id, user_id: me.id, body });
    setTxt({ ...txt, [id]: "" }); load();
  };
  const del = async (id: number) => { await supabase.from("posts").delete().eq("id", id); load(); };

  return (
    <Shell me={me}>
      <Marquee />
      {posts.length === 0 && <div className="card">Aucun article pour le moment. Publie le premier dans l&apos;onglet Vendre.</div>}
      {posts.map((p) => {
        const liked = p.likes.some((l) => l.user_id === me.id);
        return (
          <article className="card" key={p.id}>
            <Link href={`/profil/${p.seller_id}`} className="convo"><Av name={p.profiles.name} url={p.profiles.photo_url} /><div><strong>{p.profiles.name}</strong><div className="meta">{p.ville}</div></div></Link>
            <img className="ph" alt={p.title} src={p.photo_urls[0]} />
            <h3>{p.title}</h3>
            <div className="row" style={{ margin: "6px 0" }}><span className="price">{fcfa(p.price_fcfa)}</span><span className="tag">{p.etat}</span></div>
            <div className="row">
              <button className={"ghost" + (liked ? " on" : "")} onClick={() => like(p)} aria-label="J'aime">{liked ? "♥" : "♡"} {p.likes.length}</button>
              {p.seller_id !== me.id && <Link className="ghost-link" href={`/messages/${p.seller_id}`}>Écrire au vendeur</Link>}
              {(p.seller_id === me.id || me.role === "admin") && <button className="ghost" onClick={() => del(p.id)}>Supprimer</button>}
            </div>
            {p.seller_id !== me.id && <ReportButton meId={me.id} userId={p.seller_id} postId={p.id} />}
            {p.comments.map((c) => <div className="cm" key={c.id}><strong>{c.profiles.name}</strong> {c.body}</div>)}
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder="Écrire un commentaire" aria-label="Commentaire" value={txt[p.id] || ""} onChange={(e) => setTxt({ ...txt, [p.id]: e.target.value })} />
              <button onClick={() => send(p.id)}>Envoyer</button>
            </div>
          </article>
        );
      })}
    </Shell>
  );
    }
      
