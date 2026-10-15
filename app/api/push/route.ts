import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Appelé par Supabase (Database Webhook) à chaque nouvelle notification
export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  const { record: n } = await req.json();
  if (!n?.user_id) return NextResponse.json({ ok: true });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  const { data: subs } = await db.from("push_subscriptions").select("*").eq("user_id", n.user_id);
  if (!subs?.length) return NextResponse.json({ ok: true });
  const { data: actor } = await db.from("profiles").select("name").eq("id", n.actor_id).single();
  const { data: post } = n.post_id ? await db.from("posts").select("title").eq("id", n.post_id).single() : { data: null };

  const who = actor?.name ?? "Quelqu'un";
  const title = post ? ` « ${post.title} »` : "";
  const body =
    n.type === "like" ? `${who} a aimé ton article${title}` :
    n.type === "comment" ? `${who} a commenté ton article${title}` :
    n.type === "order" ? `${who} a acheté ton article${title}` :
    n.type === "friend_request" ? `${who} t'a envoyé une demande d'ami` :
    `${who} t'a envoyé un message`;
  const url = n.type === "message" ? `/messages/${n.actor_id}` : n.type === "friend_request" ? "/amis" : n.type === "order" ? "/commandes" : "/notifications";
  const payload = JSON.stringify({ title: "Chendam", body, url, tag: `${n.type}-${n.actor_id}` });

  await Promise.all(subs.map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
    } catch (e: any) {
      // téléphone désinscrit : on le retire
      if (e.statusCode === 404 || e.statusCode === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
    }
  }));
  return NextResponse.json({ ok: true });
}
