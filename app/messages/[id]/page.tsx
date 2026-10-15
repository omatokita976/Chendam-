"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, type Msg } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";

type Kind = "image" | "video" | "audio";

export default function Chat() {
  const me = useMe();
  const { id: other } = useParams<{ id: string }>();
  const [peer, setPeer] = useState<{ name: string; photo_url: string | null } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const end = useRef<HTMLDivElement>(null);

  const sign = useCallback(async (list: Msg[]) => {
    const paths = list.filter((m) => m.media_url).map((m) => m.media_url!);
    if (!paths.length) return;
    const { data } = await supabase.storage.from("chat-media").createSignedUrls(paths, 3600);
    const map: Record<string, string> = {};
    data?.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
    setUrls((u) => ({ ...u, ...map }));
  }, []);

  const load = useCallback(async () => {
    if (!me) return;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${me.id},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me.id})`)
      .order("created_at", { ascending: true }).limit(200);
    const list = (data as Msg[]) ?? [];
    setMsgs(list); sign(list);
    await supabase.rpc("mark_conversation_read", { other }); // retire la pastille rouge
  }, [me, other, sign]);

  useEffect(() => {
    if (!me) return;
    supabase.from("profiles").select("name,photo_url").eq("id", other).single().then(({ data }) => setPeer(data));
    load();
    const ch = supabase.channel("chat-" + other)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, other, load]);
  useEffect(() => { end.current?.scrollIntoView(); }, [msgs]);
  if (!me) return null;

  const send = async (body: string, file?: Blob, type?: Kind, ext?: string) => {
    setErr(""); setBusy(true);
    let media_url: string | null = null;
    if (file && type) {
      const path = `${me.id}/${other}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type });
      if (up.error) { setBusy(false); return setErr("Envoi impossible : " + up.error.message); }
      media_url = path;
    }
    const { error } = await supabase.from("messages").insert({ sender_id: me.id, receiver_id: other, body, media_url, media_type: type ?? null });
    setBusy(false);
    if (error) return setErr(error.message);
    setText(""); load();
  };

  const pickFile = (f?: File) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) return setErr("Fichier trop lourd (50 Mo maximum).");
    const ext = (f.name.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "");
    send("", f, f.type.startsWith("video") ? "video" : "image", ext);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const r = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mime ?? "audio/webm";
        send("", new Blob(chunks.current, { type }), "audio", type === "audio/mp4" ? "m4a" : "webm");
      };
      r.start(); recorder.current = r; setRec(true);
    } catch { setErr("Micro non autorisé. Autorise le micro dans ton navigateur."); }
  };
  const stopRec = () => { recorder.current?.stop(); setRec(false); };

  return (
    <Shell me={me}>
      <div className="row" style={{ marginBottom: 12 }}>
        <Link href="/messages" className="ghost-link" aria-label="Retour">←</Link>
        <Av name={peer?.name ?? "?"} url={peer?.photo_url} /><strong>{peer?.name}</strong>
      </div>
      <div className="msgs">
        {msgs.map((m) => {
          const u = m.media_url ? urls[m.media_url] : undefined;
          const wait = <span className="meta">Chargement…</span>;
          return (
            <div key={m.id} className={"bub" + (m.sender_id === me.id ? " me" : "")}>
              {m.media_type === "image" && (u ? <img alt="Photo envoyée" src={u} /> : wait)}
              {m.media_type === "video" && (u ? <video src={u} controls playsInline /> : wait)}
              {m.media_type === "audio" && (u ? <audio src={u} controls /> : wait)}
              {m.body && <div>{m.body}</div>}
              <div className="meta">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {err && <p className="err">{err}</p>}
      <div className="composer">
        <label className="iconbtn" aria-label="Envoyer une photo ou une vidéo">📎
          <input type="file" accept="image/*,video/*" hidden disabled={busy || me.is_banned} onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <button className={"iconbtn" + (rec ? " rec" : "")} onClick={rec ? stopRec : startRec} disabled={busy || me.is_banned}
          aria-label={rec ? "Arrêter et envoyer le vocal" : "Enregistrer un vocal"}>{rec ? "⏹" : "🎤"}</button>
        <input placeholder={rec ? "Enregistrement… touche ⏹ pour envoyer" : "Écrire un message"} aria-label="Message" value={text}
          disabled={rec} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) send(text.trim()); }} />
        <button onClick={() => text.trim() && send(text.trim())} disabled={busy || rec || me.is_banned}>Envoyer</button>
      </div>
    </Shell>
  );
}
