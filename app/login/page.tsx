"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Marquee from "@/components/Marquee";

export default function Login() {
  const router = useRouter();
  const [signup, setSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setMsg("");
    const m = email.trim().toLowerCase();
    if (!/^[^@\s]+@gmail\.com$/.test(m)) return setErr("Entre une adresse Gmail valide, par exemple nom@gmail.com.");
    if (signup) {
      if (pw.length < 8) return setErr("Le mot de passe doit avoir au moins 8 caractères.");
      if (pw !== pw2) return setErr("Les deux mots de passe sont différents.");
      const { error } = await supabase.auth.signUp({ email: m, password: pw });
      if (error) return setErr(error.message);
      setMsg("Compte créé. Ouvre ta boîte Gmail (regarde aussi les spams), clique sur le lien de confirmation, puis connecte-toi.");
      setSignup(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: m, password: pw });
      if (error) return setErr("Email ou mot de passe incorrect, ou email pas encore confirmé.");
      router.replace("/");
    }
  };

  return (
    <div className="land">
      <header className="land-top">
        <div className="logo">Chendam</div>
        <span className="flagchip">🇨🇲 Cameroun</span>
      </header>
      <main className="land-main">
        <p className="eyebrow"><span className="dot" />Est. 2026 — Seconde main</p>
        <h1 className="mega">ACHÈTE.<br />VENDS.<br />RECOMMENCE<em className="sq" /></h1>
        <p className="lead">La seconde main pensée pour les quartiers, les marchés et les bonnes affaires qu&apos;on ne trouve nulle part ailleurs.</p>
        <div className="tri"><i /><i /><i /></div>

        <p className="eyebrow small">Rejoins la communauté</p>
        <div className="frame">
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
          <div className="tabs">
            <button className={signup ? "on" : ""} onClick={() => setSignup(true)}>Créer un compte</button>
            <button className={signup ? "" : "on"} onClick={() => setSignup(false)}>Se connecter</button>
          </div>
          <label htmlFor="e">Adresse Gmail</label>
          <input id="e" type="email" autoComplete="email" placeholder="nom@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="p">Mot de passe</label>
          <input id="p" type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder="8 caractères minimum" value={pw} onChange={(e) => setPw(e.target.value)} />
          {signup && (<><label htmlFor="p2">Confirmer le mot de passe</label><input id="p2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></>)}
          {err && <p className="err">{err}</p>}
          {msg && <p className="note">{msg}</p>}
          <button className="pill" onClick={submit}>{signup ? "Créer mon compte" : "Me connecter"}</button>
        </div>
        <p className="foot">Gmail obligatoire · Paiement direct entre vendeur et acheteur</p>
      </main>
      <Marquee />
    </div>
  );
        }
            
