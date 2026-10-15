-- À exécuter dans Supabase > SQL Editor (après chendam_notifications.sql)
-- Téléphones qui reçoivent les notifications

create table push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "voir et retirer ses appareils" on push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Enregistrer un téléphone (si le téléphone change de compte, il passe au nouveau compte)
create function register_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language sql security definer set search_path = public as $$
  insert into push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth
$$;
