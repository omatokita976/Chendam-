"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { countFriends, plural } from "@/lib/friends";
import { useMe } from "@/lib/useMe";
import Shell, { Av } from "@/components/Shell";

export default function Profil() {
  const me = useMe();
  const router = useRouter();
  const [name, setName] = useState("");
  const [ville, setVille] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [nf, setNf] = useState(0);
  useEffect(() => { if (me) { countFriends(me.id).then(setNf); setName(me.name); setVille(me.ville ?? ""); setPhoto(me.photo_url); } }, [me]);
  if (!me) return null;

  const changePhoto = async (file?: File) => {
    if (!file) return;
    const path = `${me.id}/avatar-${Date.now()}`;
    const up = await supabase.storage.from("photos").upload(path, file);
    if (up.error) return setMsg(up.error.message);
    const url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ photo_url: url }).eq("id", me.id);
    setPhoto(url);
  };
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ name: name.trim() || me.name, ville: ville.trim() }).eq("id", me.id);
    setMsg(error ? error.message : "Profil enregistré.");
  };
  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <Shell me={me}>
      <div className="card">
        <div className="row"><Av name={name || me.name} url={photo} big /><div><h2>{name}</h2><Link href="/amis" className="meta">{plural(nf)}</Link></div></div>
        <label htmlFor="ph">Changer la photo de profil</label>
        <input id="ph" type="file" accept="image/*" onChange={(e) => changePhoto(e.target.files?.[0])} />
        <label htmlFor="n">Nom affiché</label>
        <input id="n" value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="v">Ville</label>
        <input id="v" value={ville} onChange={(e) => setVille(e.target.value)} />
        {msg && <p className="note">{msg}</p>}
        <p className="row"><button onClick={save}>Enregistrer</button><button className="ghost" onClick={logout}>Se déconnecter</button></p>
        {me.role === "admin" && <p><Link href="/admin" className="ghost-link">Espace admin</Link></p>}
      </div>
    </Shell>
  );
}
