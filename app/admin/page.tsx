"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";
import AdultImage from "@/components/AdultImage";

type R = {
  id: number; reason: string; status: string; decision: string | null; created_at: string; evidence_urls: string[];
  reporter: { name: string } | null;
  reported: { id: string; name: string; is_banned: boolean; photo_url: string | null } | null;
  posts: { id: number; title: string; photo_urls: string[]; status: string; adult: boolean } | null;
};
type U = { id: string; name: string; photo_url: string | null; ville: string | null; is_banned: boolean; role: string; created_at?: string };
type PostRow = { id: number; title: string; price_fcfa: number; photo_urls: string[]; status: string; created_at: string; adult: boolean; profiles: { name: string } | null };

// Double authentification : code à 6 chiffres d'une application (Google Authenticator, etc.)
function Mfa({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"loading" | "enroll" | "verify">("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const f = await supabase.auth.mfa.listFactors();
      const v = f.data?.totp?.[0];
      if (v) { setFactorId(v.id); setMode("verify"); return; }
      const e = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Chendam admin " + Date.now() });
      if (e.error || !e.data) { setErr(e.error?.message ?? "Erreur"); return; }
      setFactorId(e.data.id); setQr(e.data.totp.qr_code); setSecret(e.data.totp.secret); setMode("enroll");
    })();
  }, []);

  const verify = async () => {
    setErr("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) return setErr("Code incorrect. Entre le code actuel affiché dans ton application.");
    onDone();
  };

  return (
    <div className="card">
      <h2>Vérification de sécurité</h2>
      {mode === "loading" && <p className="meta">Chargement…</p>}
      {mode === "enroll" && (<>
        <p className="meta">Première connexion admin : scanne ce code avec une application d&apos;authentification (Google Authenticator, Microsoft Authenticator, Authy), puis entre le code à 6 chiffres.</p>
        <img alt="Code QR à scanner" src={qr} style={{ width: 200, height: 200, background: "#fff", borderRadius: 12 }} />
        <p className="meta">Ou entre cette clé à la main : <strong>{secret}</strong></p>
      </>)}
      {mode === "verify" && <p className="meta">Entre le code à 6 chiffres de ton application d&apos;authentification.</p>}
      {mode !== "loading" && (<>
        <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" aria-label="Code à 6 chiffres" value={code} onChange={(e) => setCode(e.target.value)} />
        <p><button onClick={verify}>Valider</button></p>
      </>)}
      {err && <p className="err">{err}</p>}
    </div>
  );
}

export default function Admin() {
  const me = useMe();
  const [gate, setGate] = useState<"checking" | "mfa" | "ok">("checking");
  const [tab, setTab] = useState<"stats" | "reports" | "posts" | "users">("stats");
  const [showDone, setShowDone] = useState(false);
  const [rs, setRs] = useState<R[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [us, setUs] = useState<U[]>([]);
  const [err, setErr] = useState("");
  const [st, setSt] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<U[]>([]);
  const [ps, setPs] = useState<PostRow[]>([]);
  const [onlyBanned, setOnlyBanned] = useState(false);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => setGate(data?.currentLevel === "aal2" ? "ok" : "mfa"));
  }, [me]);

  const loadR = useCallback(async () => {
    const { data } = await supabase.from("reports")
      .select("*, reporter:profiles!reporter_id(name), reported:profiles!reported_user_id(id,name,is_banned,photo_url), posts(id,title,photo_urls,status,adult)")
      .order("created_at", { ascending: false }).limit(100);
    const list = ((data as any) ?? []) as R[];
    setRs(list);
    const paths = list.flatMap((r) => r.evidence_urls);
    if (paths.length) {
      const { data: s } = await supabase.storage.from("reports").createSignedUrls(paths, 3600);
      const m: Record<string, string> = {};
      s?.forEach((x) => { if (x.path && x.signedUrl) m[x.path] = x.signedUrl; });
      setUrls(m);
    }
  }, []);
  useEffect(() => { if (gate === "ok") loadR(); }, [gate, loadR]);

  // Les chiffres du site
  const loadStats = useCallback(async () => {
    const cnt = async (q: any) => (await q).count ?? 0;
    const head = { count: "exact", head: true } as const;
    const week = new Date(Date.now() - 7 * 864e5).toISOString();
    const day = new Date(Date.now() - 864e5).toISOString();
    const [users, newUsers, today, banned, active, openR] = await Promise.all([
      cnt(supabase.from("profiles").select("id", head)),
      cnt(supabase.from("profiles").select("id", head).gte("created_at", week)),
      cnt(supabase.from("profiles").select("id", head).gte("created_at", day)),
      cnt(supabase.from("profiles").select("id", head).eq("is_banned", true)),
      cnt(supabase.from("posts").select("id", head).eq("status", "active")),
      cnt(supabase.from("reports").select("id", head).eq("status", "open")),
    ]);
    setSt({ users, newUsers, today, banned, active, openR });
    const { data } = await supabase.from("profiles").select("id,name,photo_url,ville,is_banned,role,created_at")
      .order("created_at", { ascending: false }).limit(10);
    setRecent((data as U[]) ?? []);
  }, []);
  // Toutes les publications, pour pouvoir en supprimer une directement
  const loadP = useCallback(async () => {
    const { data } = await supabase.from("posts").select("id,title,price_fcfa,photo_urls,status,created_at,adult,profiles!seller_id(name)")
      .order("created_at", { ascending: false }).limit(60);
    setPs((data as any) ?? []);
  }, []);
  useEffect(() => { if (gate === "ok") { loadStats(); loadP(); } }, [gate, loadStats, loadP]);

  const loadU = useCallback(async () => {
    let query = supabase.from("profiles").select("id,name,photo_url,ville,is_banned,role,created_at").order("created_at", { ascending: false }).limit(40);
    if (q.trim().length >= 2) query = query.ilike("name", `%${q.trim()}%`);
    if (onlyBanned) query = query.eq("is_banned", true);
    const { data } = await query;
    setUs((data as U[]) ?? []);
  }, [q, onlyBanned]);
  useEffect(() => {
    if (gate !== "ok" || tab !== "users") return;
    const t = setTimeout(loadU, 300);
    return () => clearTimeout(t);
  }, [gate, tab, loadU]);

  if (!me) return null;
  if (me.role !== "admin") return <Shell me={me}><div className="card">Cet espace est réservé à l&apos;administrateur.</div></Shell>;
  if (gate === "checking") return <Shell me={me}><div className="card meta">Vérification…</div></Shell>;
  if (gate === "mfa") return <Shell me={me}><Mfa onDone={() => setGate("ok")} /></Shell>;

  const fail = (e: { message: string } | null) => { if (e) setErr(e.message); return !e; };
  const mark = async (r: R, label: string) => {
    const { error } = await supabase.from("reports").update({
      status: "handled", decision: r.decision ? `${r.decision}, ${label}` : label, handled_at: new Date().toISOString(),
    }).eq("id", r.id);
    return fail(error);
  };
  const delPost = async (r: R) => {
    if (!r.posts || !confirm(`Supprimer la publication « ${r.posts.title} » ?`)) return;
    setErr("");
    if (!(await mark(r, "publication supprimée"))) return;
    fail((await supabase.from("posts").delete().eq("id", r.posts.id)).error);
    loadR();
  };
  const ban = async (r: R, b: boolean) => {
    if (!r.reported || !confirm(`${b ? "Bannir" : "Débannir"} ${r.reported.name} ?`)) return;
    setErr("");
    if (!fail((await supabase.from("profiles").update({ is_banned: b }).eq("id", r.reported.id)).error)) return;
    await mark(r, b ? "compte banni" : "compte débanni");
    loadR();
  };
  const ignore = async (r: R) => { setErr(""); await mark(r, "aucune action"); loadR(); };
  const banUser = async (u: U, b: boolean) => {
    if (!confirm(`${b ? "Bannir" : "Débannir"} ${u.name} ?`)) return;
    setErr("");
    fail((await supabase.from("profiles").update({ is_banned: b }).eq("id", u.id)).error);
    loadU();
  };

  const removePost = async (p: PostRow) => {
    if (!confirm(`Supprimer la publication « ${p.title} » ?`)) return;
    setErr("");
    fail((await supabase.from("posts").delete().eq("id", p.id)).error);
    loadP(); loadStats();
  };

  const toggleAdult = async (p: PostRow) => {
    setErr("");
    fail((await supabase.from("posts").update({ adult: !p.adult }).eq("id", p.id)).error);
    loadP();
  };

  const open = rs.filter((r) => r.status === "open");
  const shown = showDone ? rs.filter((r) => r.status !== "open") : open;

  return (
    <Shell me={me}>
      <h2 style={{ marginBottom: 4 }}>Espace admin</h2>
      <div className="seg" style={{ flexWrap: "wrap", borderRadius: 24 }}>
        <button className={tab === "stats" ? "on" : ""} onClick={() => { setTab("stats"); loadStats(); }}>Chiffres</button>
        <button className={tab === "reports" ? "on" : ""} onClick={() => setTab("reports")}>Signalements ({open.length})</button>
        <button className={tab === "posts" ? "on" : ""} onClick={() => { setTab("posts"); loadP(); }}>Publications</button>
        <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>Comptes</button>
      </div>
      {err && <p className="err">{err}</p>}

      {tab === "stats" && (<>
        <div className="statgrid">
          <div className="stat big"><b>{st.users ?? "…"}</b><span>personnes inscrites sur Chendam</span></div>
          <div className="stat"><b>{st.today ?? "…"}</b><span>inscrits ces 24 h</span></div>
          <div className="stat"><b>{st.newUsers ?? "…"}</b><span>inscrits cette semaine</span></div>
          <div className="stat"><b>{st.active ?? "…"}</b><span>articles en ligne</span></div>
          <div className="stat"><b>{st.openR ?? "…"}</b><span>signalements à traiter</span></div>
          <div className="stat"><b>{st.banned ?? "…"}</b><span>comptes bannis</span></div>
        </div>
        <h3 style={{ margin: "18px 0 10px" }}>Dernières inscriptions</h3>
        {recent.map((u) => (
          <Link key={u.id} href={`/profil/${u.id}`} className="card convo">
            <Av name={u.name} url={u.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{u.name}</strong>
              <div className="meta">{u.ville || "Ville non indiquée"}{u.created_at ? ` · ${new Date(u.created_at).toLocaleDateString("fr-FR")}` : ""}</div>
            </div>
            {u.is_banned && <span className="tag" style={{ color: "var(--r)" }}>Banni</span>}
          </Link>
        ))}
      </>)}

      {tab === "posts" && (<>
        {ps.length === 0 && <div className="card meta">Aucune publication.</div>}
        {ps.map((p) => (
          <div className="card" key={p.id}>
            <div className="row">
              <AdultImage adult={p.adult} alt={p.title} src={p.photo_urls[0]} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{p.title}</strong>
                <div className="meta">{p.profiles?.name ?? "?"} · {new Date(p.created_at).toLocaleDateString("fr-FR")}</div>
                <span className="price">{p.price_fcfa.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
            <p className="row" style={{ flexWrap: "wrap" }}><button onClick={() => removePost(p)}>Supprimer la publication</button><button className="ghost" onClick={() => toggleAdult(p)}>{p.adult ? "Retirer le flou 18+" : "Flouter (18+)"}</button></p>
          </div>
        ))}
      </>)}

      {tab === "reports" && (<>
        <p><button className="ghost" onClick={() => setShowDone(!showDone)}>{showDone ? "Voir les signalements à traiter" : "Voir les signalements traités"}</button></p>
        {shown.length === 0 && <div className="card meta">{showDone ? "Aucun signalement traité." : "Aucun signalement à traiter."}</div>}
        {shown.map((r) => (
          <div className="card" key={r.id}>
            <div className="meta">Signalé par {r.reporter?.name ?? "?"} le {new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
            <p><strong>Motif :</strong> {r.reason}</p>
            {r.reported && (
              <div className="row">
                <Av name={r.reported.name} url={r.reported.photo_url} />
                <Link href={`/profil/${r.reported.id}`} style={{ color: "inherit" }}><strong>{r.reported.name}</strong></Link>
                {r.reported.is_banned && <span className="tag" style={{ color: "var(--r)" }}>Banni</span>}
              </div>
            )}
            {r.posts && (<div><AdultImage adult={r.posts.adult} className="ph" alt={r.posts.title} src={r.posts.photo_urls[0]} /><strong>{r.posts.title}</strong></div>)}
            {r.evidence_urls.length > 0 && (
              <div className="thumbs">
                {r.evidence_urls.map((p) => urls[p] ? <a key={p} href={urls[p]} target="_blank" rel="noreferrer"><img alt="Preuve" src={urls[p]} /></a> : null)}
              </div>
            )}
            {r.decision && <p className="note">Décision : {r.decision}</p>}
            <div className="row" style={{ flexWrap: "wrap", marginTop: 10 }}>
              {r.posts && <button onClick={() => delPost(r)}>Supprimer la publication</button>}
              {r.reported && (r.reported.is_banned
                ? <button onClick={() => ban(r, false)}>Débannir</button>
                : <button onClick={() => ban(r, true)}>Bannir le compte</button>)}
              {r.status === "open" && <button className="ghost" onClick={() => ignore(r)}>Ne rien faire</button>}
            </div>
          </div>
        ))}
      </>)}

      {tab === "users" && (<>
        <input placeholder="Chercher un compte par nom" aria-label="Chercher un compte" value={q} onChange={(e) => setQ(e.target.value)} />
        <p><button className="ghost" onClick={() => setOnlyBanned(!onlyBanned)}>{onlyBanned ? "Voir tous les comptes" : "Voir seulement les comptes bannis"}</button></p>
        <div style={{ marginTop: 12 }}>
          {us.length === 0 && <div className="card meta">{onlyBanned ? "Aucun compte banni." : "Aucun compte trouvé."}</div>}
          {us.map((u) => (
            <div className="card row" style={{ flexWrap: "wrap" }} key={u.id}>
              <Link href={`/profil/${u.id}`} className="convo" style={{ flex: 1, minWidth: 140 }}>
                <Av name={u.name} url={u.photo_url} />
                <div><strong>{u.name}</strong><div className="meta">{u.ville}{u.is_banned ? " · banni" : ""}</div></div>
              </Link>
              {u.role !== "admin" && (u.is_banned
                ? <button onClick={() => banUser(u, false)}>Débannir</button>
                : <button onClick={() => banUser(u, true)}>Bannir</button>)}
            </div>
          ))}
        </div>
      </>)}
    </Shell>
  );
    }
    
