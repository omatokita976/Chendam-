import { supabase } from "./supabase";

export type Rel = { id: number; status: "pending" | "accepted" | "declined"; mine: boolean } | null;

export async function relWith(me: string, other: string): Promise<Rel> {
  const { data } = await supabase.from("friendships").select("*")
    .or(`and(requester.eq.${me},addressee.eq.${other}),and(requester.eq.${other},addressee.eq.${me})`).maybeSingle();
  return data ? { id: data.id, status: data.status, mine: data.requester === me } : null;
}
export async function countFriends(id: string): Promise<number> {
  const { data } = await supabase.rpc("friend_count", { uid: id });
  return (data as number) ?? 0;
}
export const plural = (n: number) => `${n} ami${n > 1 ? "s" : ""}`;
