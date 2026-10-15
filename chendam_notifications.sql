-- À exécuter dans Supabase > SQL Editor (après chendam_amis.sql)
-- Notifications : message, demande d'ami, like, commentaire

-- 1. Ajouter le type "message"
alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like','comment','friend_request','message'));

-- 2. Notification à chaque nouveau message
--    (une seule notification non lue par personne, pour ne pas inonder la liste)
create function notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from notifications
    where user_id = new.receiver_id and actor_id = new.sender_id
      and type = 'message' and read_at is null
  ) then
    insert into notifications (user_id, actor_id, type)
    values (new.receiver_id, new.sender_id, 'message');
  end if;
  return new;
end $$;
create trigger t_message after insert on messages
  for each row execute function notify_message();

-- 3. Ouvrir une conversation retire aussi la notification de message
create or replace function mark_conversation_read(other uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update messages set read_at = now()
  where receiver_id = auth.uid() and sender_id = other and read_at is null;
  update notifications set read_at = now()
  where user_id = auth.uid() and actor_id = other and type = 'message' and read_at is null;
end $$;

-- 4. Notifications en temps réel
alter publication supabase_realtime add table notifications;
