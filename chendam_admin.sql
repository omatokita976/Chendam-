-- À exécuter dans Supabase > SQL Editor (après chendam_push.sql)
-- Espace admin : signalements avec preuves, bannir / débannir, supprimer une publication

-- 1. Être admin = rôle "admin" ET code à 6 chiffres validé (double authentification)
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- 2. Décision prise sur un signalement
alter table reports add column decision text;
alter table reports add column handled_at timestamptz;

-- 3. Les articles d'un compte banni disparaissent du site
drop policy "voir articles" on posts;
create policy "voir articles" on posts for select to authenticated
  using (is_admin() or (status <> 'removed'
    and not exists (select 1 from profiles s where s.id = seller_id and s.is_banned)));

-- 4. Preuves des signalements (captures d'écran), lisibles seulement par l'auteur et l'admin
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do nothing;
create policy "envoyer une preuve" on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "lire les preuves" on storage.objects for select to authenticated
  using (bucket_id = 'reports'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 5. Un administrateur ne peut jamais être banni
create function protect_admins() returns trigger language plpgsql as $$
begin
  if new.is_banned and not old.is_banned and old.role = 'admin' then
    raise exception 'Un administrateur ne peut pas être banni';
  end if;
  return new;
end $$;
create trigger t_protect_admins before update on profiles
  for each row execute function protect_admins();

-- 6. Journal des actions admin (qui a banni, qui a supprimé)
create table admin_log (
  id bigint generated always as identity primary key,
  admin_id uuid,
  action text not null,
  target_user uuid,
  created_at timestamptz default now()
);
alter table admin_log enable row level security;
create policy "l'admin lit le journal" on admin_log for select to authenticated using (is_admin());

create function log_ban() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_banned is distinct from old.is_banned then
    insert into admin_log (admin_id, action, target_user)
    values (auth.uid(), case when new.is_banned then 'ban' else 'unban' end, new.id);
  end if;
  return new;
end $$;
create trigger t_log_ban after update on profiles for each row execute function log_ban();

create function log_post_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from old.seller_id then
    insert into admin_log (admin_id, action, target_user) values (auth.uid(), 'post_delete', old.seller_id);
  end if;
  return old;
end $$;
create trigger t_log_post_delete after delete on posts for each row execute function log_post_delete();

-- 7. TON COMPTE ADMIN : crée ton compte Chendam normalement, puis remplace ton email :
-- update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'ton.email@gmail.com');
