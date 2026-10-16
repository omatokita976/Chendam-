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
    <div className="hero">
      <Marquee />
      <div className="wrap">
        <div className="brand">
          <div className="logo">Chendam</div>
          <div className="stripe"><i /><i /><i /></div>
          <h1>Vends. Achète.<br />100 % Cameroun.</h1>
          <p>Donne une seconde vie à ce que tu n&apos;utilises plus, et trouve de bonnes affaires près de chez toi.</p>
          <div className="chips"><span>📸 Publie en 1 minute</span><span>💬 Discute en direct</span><span>🤝 Entre Camerounais</span></div>
        </div>
        <div className="card">
          <div className="seg">
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
          <p><button style={{ width: "100%" }} onClick={submit}>{signup ? "Créer mon compte" : "Me connecter"}</button></p>
        </div>
      </div>
    </div>
  );
            }
