# Chendam

## Lancer en local
1. `npm install`
2. Copie `.env.example` en `.env.local` et remplis les 2 valeurs (Supabase > Project Settings > API)
3. `npm run dev` puis ouvre http://localhost:3000

## Supabase (une seule fois)
Dans SQL Editor, exécute dans l'ordre : `chendam_supabase.sql`, `chendam_storage.sql` puis `chendam_messages.sql` puis `chendam_amis.sql` puis `chendam_notifications.sql`.

## Déployer sur Vercel
1. Mets ce dossier sur GitHub
2. vercel.com > Add New > Project > importe le dépôt
3. Ajoute les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, puis Deploy
4. Supabase > Authentication > URL Configuration : mets l'adresse Vercel dans « Site URL »
5. Plus tard, ton domaine : Vercel > Settings > Domains, puis mets le même domaine dans « Site URL » de Supabase

## Notifications sur le téléphone (vibration + écran d'accueil)
1. Exécute aussi `chendam_push.sql` dans Supabase.
2. Dans un terminal : `npx web-push generate-vapid-keys` (te donne une clé publique et une clé privée).
3. Dans Vercel > Settings > Environment Variables, ajoute :
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = la clé publique
   - `VAPID_PRIVATE_KEY` = la clé privée
   - `VAPID_SUBJECT` = `mailto:` + ton email
   - `PUSH_WEBHOOK_SECRET` = une longue phrase secrète de ton choix
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase > Project Settings > API > service_role (SECRÈTE, jamais dans le code ni sur GitHub)
   Puis redéploie.
4. Supabase > Database > Webhooks > Create a new hook : table `notifications`, événement `Insert`, type HTTP Request, méthode POST, URL `https://TON-SITE.vercel.app/api/push`, en-tête `x-webhook-secret` = la même phrase secrète.
5. Sur le téléphone, ouvre l'onglet Notifications et touche « Activer les notifications ».
   - Android (Chrome) : fonctionne directement.
   - iPhone (iOS 16.4 ou plus) : d'abord Safari > Partager > « Sur l'écran d'accueil », puis ouvre Chendam depuis l'icône.

## Espace admin
1. Exécute `chendam_admin.sql` dans Supabase (en dernier).
2. Crée ton compte Chendam normalement (Gmail + mot de passe long et unique), confirme ton email, puis exécute la commande en bas du fichier SQL (en remplaçant ton email) pour devenir admin.
3. Supabase > Authentication > Multi-Factor : vérifie que TOTP est activé.
4. Connecte-toi, ouvre Profil > Espace admin. La première fois, scanne le QR code avec Google Authenticator (ou Authy). Ensuite, chaque connexion admin demande le code à 6 chiffres.
   Les pouvoirs admin (bannir, supprimer, voir les preuves) ne fonctionnent qu'avec ce code validé, même si ton mot de passe est volé.
5. Si tu perds ton téléphone : Supabase > Authentication > Users > ton compte > supprime le facteur MFA, puis recommence l'étape 4. 
