import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const fcfa = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

export type Msg = {
  id: number; sender_id: string; receiver_id: string; body: string;
  media_url: string | null; media_type: "image" | "video" | "audio" | null;
  read_at: string | null; created_at: string;
};
