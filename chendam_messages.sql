-- À exécuter dans Supabase > SQL Editor (après les deux autres fichiers SQL)
-- Messages privés : texte, photos, vidéos et messages vocaux

alter table messages add column media_url text;
alter table messages add column media_type text check (media_type in ('image','video','audio'));
alter table messages drop constraint messages_body_check;
alter table messages alter column body set default '';
alter table messages add constraint messages_content_check
  check (length(body) <= 2000 and (length(body) > 0 or media_url is not null));

-- Sécurité : la vue des non-lus ne montre que MES messages
alter view unread_counts set (security_invoker = on);

-- Stockage privé des médias (50 Mo max par fichier)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic',
        'video/mp4','video/quicktime','video/webm',
        'audio/webm','audio/mp4','audio/mpeg'])
on conflict (id) do nothing;

-- Dossier = expéditeur/destinataire : seuls ces deux comptes peuvent lire le fichier
create policy "lire ses médias privés" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media'
    and auth.uid()::text in ((storage.foldername(name))[1], (storage.foldername(name))[2]));
create policy "envoyer un média" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Messages en temps réel
alter publication supabase_realtime add table messages;
