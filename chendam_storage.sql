-- À exécuter dans Supabase > SQL Editor (après chendam_supabase.sql) : stockage des photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
create policy "photos lisibles" on storage.objects for select using (bucket_id = 'photos');
create policy "envoyer ses photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "supprimer ses photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
