"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type State = "checking" | "unsupported" | "ios-install" | "off" | "on" | "denied";

const toKey = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
};

export default function EnablePush() {
  const [state, setState] = useState<State>("checking");
  const [err, setErr] = useState("");

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (ios && !standalone) return setState("ios-install");
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    });
  }, []);

  const enable = async () => {
    setErr("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });
      const j = sub.toJSON();
      const { error } = await supabase.rpc("register_push", { p_endpoint: j.endpoint, p_p256dh: j.keys!.p256dh, p_auth: j.keys!.auth });
      if (error) throw error;
      setState("on");
      reg.showNotification("Chendam", { body: "Notifications activées sur ce téléphone.", icon: "/icon-192.png", vibrate: [200, 100, 200] } as NotificationOptions);
    } catch (e: any) {
      setErr("Activation impossible : " + (e?.message ?? "erreur"));
    }
  };

  if (state === "checking") return null;
  return (
    <div className="card">
      <strong>Notifications sur le téléphone</strong>
      {state === "on" && <p className="meta">Activées ✓ Ton téléphone vibre et affiche chaque notification, même quand Chendam est fermé.</p>}
      {state === "off" && (<><p className="meta">Reçois chaque message, demande d&apos;ami, j&apos;aime et commentaire sur l&apos;écran de ton téléphone, avec une vibration.</p><button onClick={enable}>Activer les notifications</button></>)}
      {state === "ios-install" && <p className="meta">Sur iPhone : ouvre Chendam dans Safari, touche Partager, puis « Sur l&apos;écran d&apos;accueil ». Ouvre ensuite Chendam depuis cette icône pour activer les notifications.</p>}
      {state === "denied" && <p className="meta">Les notifications sont bloquées. Autorise-les pour Chendam dans les réglages de ton navigateur ou de ton téléphone.</p>}
      {state === "unsupported" && <p className="meta">Ce navigateur ne gère pas les notifications. Essaie avec Chrome (Android) ou Safari (iPhone, depuis l&apos;écran d&apos;accueil).</p>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
