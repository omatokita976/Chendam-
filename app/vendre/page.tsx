"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, fcfa } from "@/lib/supabase";
import { useMe } from "@/lib/useMe";
import Shell from "@/components/Shell";

export default function Vendre() {
  const me = useMe();
  const router = useRouter();
  const [f, setF] = useState({ title: "", price: "", etat: "Bon état", ville: "" });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!me) return null;
  const price = Number(f.price) || 0;

  const submit = async () => {
    if (!f.title.trim() || price <= 0) return setErr("Ajoute un titre et un prix en FCFA.");
    if (!file) return setErr("Ajoute au moins une photo de l'article pour publier.");
    setBusy(true); setErr("");
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const up = await supabase.storage.from("photos").upload(path, file);
    if (up.error) { setBusy(false); return setErr("Photo non envoyée : " + up.error.message); }
    const url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("posts").insert({
      seller_id: me.id, title: f.title.trim(), price_fcfa: price, etat: f.etat,
      ville: f.ville.trim() || me.ville || "Cameroun", photo_urls: [url],
    });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push("/");
  };

  return (
    <Shell me={me}>
      <div className="card">
        <h2>Vendre un article</h2>
        <label htmlFor="t">Titre</label>
        <input id="t" placeholder="Ex. Fer à repasser Philips" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <label htmlFor="p">Prix (FCFA)</label>
        <input id="p" type="number" inputMode="numeric" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <div className="note">Le paiement se règle directement entre l&apos;acheteur et toi. Mettez-vous d&apos;accord par message. Conseil : donne l&apos;article et encaisse le paiement en main propre, au même moment.</div>
        <label htmlFor="e">État</label>
        <select id="e" value={f.etat} onChange={(e) => setF({ ...f, etat: e.target.value })}>
          <option>Comme neuf</option><option>Très bon état</option><option>Bon état</option><option>À réparer</option>
        </select>
        <label htmlFor="v">Ville</label>
        <input id="v" placeholder="Douala, Yaoundé, Bamenda…" value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} />
        <label htmlFor="f">Photo de l&apos;article (obligatoire)</label>
        <input id="f" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file && <img className="ph" alt="Aperçu" src={URL.createObjectURL(file)} />}
        {err && <p className="err">{err}</p>}
        <p><button onClick={submit} disabled={busy || me.is_banned}>{busy ? "Publication…" : "Publier"}</button></p>
      </div>
    </Shell>
  );
        }
