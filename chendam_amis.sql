-- À exécuter dans Supabase > SQL Editor (après chendam_messages.sql)
-- Amis : nombre d'amis public, pas de doublon d'invitation, annulation, notification

-- Nombre d'amis visible par tout le monde (seulement le chiffre, jamais la liste)
create function friend_count(uid uuid) returns integer
language sql security definer stable set search_path = public as $$
  select count(*)::int from friendships
  where status = 'accepted' and (requester = uid or addressee = uid)
$$;

-- Une seule relation par paire de personnes (pas d'invitation croisée en double)
create unique index friendships_pair on friendships
  (least(requester, addressee), greatest(requester, addressee));

-- Annuler une invitation ou retirer un ami
create policy "supprimer une amitié" on friendships for delete to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

-- Notification quand on reçoit une invitation
create function notify_friend_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, actor_id, type)
  values (new.addressee, new.requester, 'friend_request');
  return new;
end $$;
create trigger t_friend after insert on friendships
  for each row execute function notify_friend_request();

alter publication supabase_realtime add table friendships;
