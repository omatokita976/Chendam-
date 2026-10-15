-- CHENDAM : base de données (Supabase / PostgreSQL)
-- À coller dans Supabase > SQL Editor > Run

-- 1. PROFILS (un par compte) ------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  ville text,
  photo_url text,
  role text not null default 'user' check (role in ('user','admin')),
  is_banned boolean not null default false,
  created_at timestamptz default now()
);

-- Seuls les emails Gmail peuvent créer un compte
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) not like '%@gmail.com' then
    raise exception 'Inscription réservée aux adresses Gmail';
  end if;
  insert into profiles (id, name)
  values (new.id, initcap(replace(split_part(new.email,'@',1),'.',' ')));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;
create function not_banned() returns boolean
language sql security definer stable set search_path = public as $$
  select not exists (select 1 from profiles where id = auth.uid() and is_banned)
$$;

-- 2. ARTICLES (photo obligatoire) -------------------------------------
create table posts (
  id bigint generated always as identity primary key,
  seller_id uuid not null references profiles on delete cascade,
  title text not null,
  price_fcfa integer not null check (price_fcfa > 0),
  etat text not null,
  ville text,
  photo_urls text[] not null check (array_length(photo_urls,1) >= 1),
  status text not null default 'active' check (status in ('active','sold','removed')),
  created_at timestamptz default now()
);
create table likes (
  post_id bigint references posts on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (post_id, user_id)
);
create table comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz default now()
);

-- 3. AMIS --------------------------------------------------------------
create table friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references profiles on delete cascade,
  addressee uuid not null references profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now(),
  unique (requester, addressee), check (requester <> addressee)
);
-- Suggestions : même ville, pas encore en relation
create function suggest_friends() returns setof profiles
language sql security definer stable set search_path = public as $$
  select p.* from profiles p, profiles me
  where me.id = auth.uid() and p.id <> me.id and not p.is_banned
    and p.ville is not null and lower(p.ville) = lower(me.ville)
    and not exists (select 1 from friendships f
      where (f.requester = me.id and f.addressee = p.id)
         or (f.requester = p.id and f.addressee = me.id))
  limit 20
$$;

-- 4. MESSAGERIE (pastille rouge = messages non lus) --------------------
create table messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references profiles on delete cascade,
  receiver_id uuid not null references profiles on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz default now()
);
create index on messages (receiver_id, read_at);
-- Nombre de non-lus par expéditeur
create view unread_counts as
  select receiver_id, sender_id, count(*) as n
  from messages where read_at is null group by 1,2;
-- Ouvrir une conversation : retire la pastille
create function mark_conversation_read(other uuid) returns void
language sql security definer set search_path = public as $$
  update messages set read_at = now()
  where receiver_id = auth.uid() and sender_id = other and read_at is null
$$;

-- 5. NOTIFICATIONS (like, commentaire, invitation) ---------------------
create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  actor_id uuid not null references profiles on delete cascade,
  type text not null check (type in ('like','comment','friend_request')),
  post_id bigint references posts on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now()
);
create function notify_like() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, actor_id, type, post_id)
  select seller_id, new.user_id, 'like', new.post_id
  from posts where id = new.post_id and seller_id <> new.user_id;
  return new;
end $$;
create trigger t_like after insert on likes for each row execute function notify_like();
create function notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, actor_id, type, post_id)
  select seller_id, new.user_id, 'comment', new.post_id
  from posts where id = new.post_id and seller_id <> new.user_id;
  return new;
end $$;
create trigger t_comment after insert on comments for each row execute function notify_comment();

-- 6. COMMANDES : commission de 5 % calculée automatiquement ------------
create table orders (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts,
  buyer_id uuid not null references profiles,
  seller_id uuid not null references profiles,
  amount_fcfa integer not null check (amount_fcfa > 0),
  commission_fcfa integer generated always as (round(amount_fcfa * 0.05)::integer) stored,
  seller_net_fcfa integer generated always as (amount_fcfa - round(amount_fcfa * 0.05)::integer) stored,
  status text not null default 'pending'
    check (status in ('pending','paid','delivered','completed','dispute','refunded')),
  created_at timestamptz default now()
);

-- 7. SIGNALEMENTS (motif + preuves) ------------------------------------
create table reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references profiles,
  reported_user_id uuid references profiles,
  post_id bigint references posts on delete set null,
  reason text not null,
  evidence_urls text[] not null default '{}',
  status text not null default 'open' check (status in ('open','handled')),
  created_at timestamptz default now()
);

-- 8. SÉCURITÉ : chaque ligne protégée (RLS) ----------------------------
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table friendships enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table orders enable row level security;
alter table reports enable row level security;

create policy "profils visibles" on profiles for select to authenticated using (true);
-- un utilisateur modifie son profil, sans pouvoir se donner le rôle admin ni se débannir
create policy "modifier son profil" on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
    and is_banned = (select is_banned from profiles where id = auth.uid()));
create policy "admin gère les profils" on profiles for update to authenticated
  using (is_admin()) with check (is_admin());

create policy "voir articles" on posts for select to authenticated
  using (status <> 'removed' or is_admin());
create policy "publier" on posts for insert to authenticated
  with check (seller_id = auth.uid() and not_banned());
create policy "modifier ses articles" on posts for update to authenticated
  using (seller_id = auth.uid() or is_admin());
create policy "supprimer" on posts for delete to authenticated
  using (seller_id = auth.uid() or is_admin());

create policy "voir likes" on likes for select to authenticated using (true);
create policy "liker" on likes for insert to authenticated
  with check (user_id = auth.uid() and not_banned());
create policy "retirer son like" on likes for delete to authenticated using (user_id = auth.uid());

create policy "voir commentaires" on comments for select to authenticated using (true);
create policy "commenter" on comments for insert to authenticated
  with check (user_id = auth.uid() and not_banned());
create policy "supprimer commentaire" on comments for delete to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "voir ses amitiés" on friendships for select to authenticated
  using (requester = auth.uid() or addressee = auth.uid());
create policy "inviter" on friendships for insert to authenticated
  with check (requester = auth.uid() and not_banned());
create policy "accepter ou refuser" on friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid());

create policy "voir ses messages" on messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "écrire" on messages for insert to authenticated
  with check (sender_id = auth.uid() and not_banned());

create policy "voir ses notifications" on notifications for select to authenticated
  using (user_id = auth.uid());
create policy "marquer lues" on notifications for update to authenticated
  using (user_id = auth.uid());

create policy "voir ses commandes" on orders for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());

create policy "signaler" on reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "admin voit les signalements" on reports for select to authenticated
  using (is_admin());
create policy "admin traite les signalements" on reports for update to authenticated
  using (is_admin());

-- 9. TON COMPTE ADMIN --------------------------------------------------
-- 1) Crée ton compte Chendam normalement (Gmail + mot de passe fort)
-- 2) Puis exécute, en remplaçant par TON email :
-- update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'ton.email@gmail.com');
