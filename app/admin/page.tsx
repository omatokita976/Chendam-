"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";

type R = {
  id: number; reason: string; status: string; decision: string | null; created_at: string; evidence_urls: string[];
  reporter: { name: string } | null;
  reported: { id: string; name: string; is_banned: boolean; photo_url: string | null } | null;
  posts: { id: number; title: string; photo_urls: string[]; status: string } | null;
};
type U = { id: string; name: string; photo_url: string | null; ville: string | null; is_banned: boolean; role: string };

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
  const [tab, setTab] = useState<"reports" | "users">("reports");
  const [showDone, setShowDone] = useState(false);
  const [rs, setRs] = useState<R[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [us, setUs] = useState<U[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => setGate(data?.currentLevel === "aal2" ? "ok" : "mfa"));
  }, [me]);

  const loadR = useCallback(async () => {
    const { data } = await supabase.from("reports")
      .select("*, reporter:profiles!reporter_id(name), reported:profiles!reported_user_id(id,name,is_banned,photo_url), posts(id,title,photo_urls,status)")
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

  const loadU = useCallback(async () => {
    let query = supabase.from("profiles").select("id,name,photo_url,ville,is_banned,role").limit(40);
    query = q.trim().length >= 2 ? query.ilike("name", `%${q.trim()}%`) : query.eq("is_banned", true);
    const { data } = await query;
    setUs((data as U[]) ?? []);
  }, [q]);
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

  const open = rs.filter((r) => r.status === "open");
  const shown = showDone ? rs.filter((r) => r.status !== "open") : open;

  return (
    <Shell me={me}>
      <h2 style={{ marginBottom: 4 }}>Espace admin</h2>
      <div className="seg">
        <button className={tab === "reports" ? "on" : ""} onClick={() => setTab("reports")}>Signalements ({open.length})</button>
        <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>Comptes</button>
      </div>
      {err && <p className="err">{err}</p>}

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
            {r.posts && (<div><img className="ph" alt={r.posts.title} src={r.posts.photo_urls[0]} /><strong>{r.posts.title}</strong></div>)}
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
        <input placeholder="Chercher un compte par nom (sinon : comptes bannis)" aria-label="Chercher un compte" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          {us.length === 0 && <div className="card meta">{q.trim().length >= 2 ? "Aucun compte trouvé." : "Aucun compte banni."}</div>}
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
