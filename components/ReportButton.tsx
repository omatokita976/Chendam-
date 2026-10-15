"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const REASONS = ["Arnaque ou faux article", "Harcèlement ou insultes", "Contenu interdit ou choquant", "Faux profil", "Autre"];

export default function ReportButton({ meId, userId, postId }: { meId: string; userId: string; postId?: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [txt, setTxt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true); setMsg("");
    const paths: string[] = [];
    for (const f of files.slice(0, 3)) {
      const path = `${meId}/${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const up = await supabase.storage.from("reports").upload(path, f);
      if (up.error) { setBusy(false); return setMsg("Preuve non envoyée : " + up.error.message); }
      paths.push(path);
    }
    const { error } = await supabase.from("reports").insert({
      reporter_id: meId, reported_user_id: userId, post_id: postId ?? null,
      reason: txt.trim() ? `${reason} — ${txt.trim()}` : reason, evidence_urls: paths,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setOpen(false); setFiles([]); setTxt("");
    setMsg("Merci, ton signalement a été envoyé à l'équipe.");
  };

  return (
    <div>
      <button className="ghost" onClick={() => { setOpen(!open); setMsg(""); }}>Signaler</button>
      {msg && <span className="meta">{msg}</span>}
      {open && (
        <div className="note">
          <label htmlFor={`r${userId}${postId}`}>Motif</label>
          <select id={`r${userId}${postId}`} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <label>Explique en quelques mots (facultatif)</label>
          <input value={txt} maxLength={300} onChange={(e) => setTxt(e.target.value)} />
          <label>Preuves : captures d&apos;écran (3 maximum)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} />
          <p><button onClick={send} disabled={busy}>{busy ? "Envoi…" : "Envoyer le signalement"}</button></p>
        </div>
      )}
    </div>
  );
}
