import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Politique de confidentialité — Chendam" };

export default function Confidentialite() {
  return (
    <LegalShell title="Politique de confidentialité">
      <p className="stamp">Dernière mise à jour : {LEGAL.maj}</p>
      <p>Ta vie privée compte. Cette page explique, simplement, quelles données Chendam utilise, pourquoi, et comment tu gardes le contrôle. Elle est établie en tenant compte de la loi camerounaise n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel.</p>

      <h2>1. Qui est responsable de tes données ?</h2>
      <p><strong>{LEGAL.editeur}</strong>, établi à {LEGAL.ville} (Cameroun), éditeur de Chendam ({LEGAL.site}). Contact : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.</p>

      <h2>2. Quelles données collectons-nous ?</h2>
      <ul>
        <li><strong>Ton compte :</strong> adresse Gmail, mot de passe (conservé sous une forme chiffrée que personne ne peut lire), nom affiché, ville et photo de profil.</li>
        <li><strong>Tes contenus :</strong> articles (titre, prix, état, ville, photos), commentaires, « j’aime », invitations et liste d’amis.</li>
        <li><strong>Tes messages privés :</strong> textes, photos, vidéos et messages vocaux.</li>
        <li><strong>Tes signalements :</strong> motif, explications et captures d’écran.</li>
        <li><strong>Des données techniques :</strong> adresse IP, type d’appareil et de navigateur, dates de connexion, journaux d’erreurs, et une petite information gardée dans ton navigateur pour que tu restes connecté.</li>
        <li><strong>Si tu actives les notifications sur ton téléphone :</strong> un identifiant technique de ton appareil.</li>
      </ul>
      <p>Nous ne collectons pas ta position GPS, ni ton répertoire téléphonique, ni tes données bancaires ou Mobile Money : les paiements se font hors de Chendam.</p>

      <h2>3. Pourquoi utilisons-nous ces données ?</h2>
      <ul>
        <li>Créer et gérer ton compte, afficher tes articles, faire fonctionner la messagerie et les amis : c’est nécessaire au service que tu demandes.</li>
        <li>Envoyer des notifications sur ton téléphone et afficher ta photo de profil : avec ton accord, que tu peux retirer à tout moment.</li>
        <li>Assurer la sécurité, lutter contre les arnaques et les abus, traiter les signalements : c’est notre intérêt légitime et celui des membres.</li>
        <li>Respecter la loi et répondre aux demandes des autorités compétentes.</li>
      </ul>
      <p>Nous ne vendons pas tes données et nous ne faisons pas de publicité ciblée.</p>

      <h2>4. Qui voit quoi ?</h2>
      <ul>
        <li><strong>Les autres membres connectés voient :</strong> ton nom, ta photo, ta ville, ton nombre d’amis, tes articles, tes « j’aime » et tes commentaires.</li>
        <li><strong>Personne d’autre ne voit :</strong> ton adresse e-mail et ton mot de passe.</li>
        <li><strong>Tes messages privés</strong> ne sont lisibles que par toi et ton destinataire. Nous ne les ouvrons pas, sauf si la loi nous y oblige ou pour traiter un signalement d’abus grave.</li>
        <li><strong>Les administrateurs de Chendam</strong> peuvent voir les signalements et leurs preuves, supprimer un contenu et suspendre un compte. L’accès administrateur est protégé par un code à usage unique.</li>
      </ul>

      <h2>5. Nos prestataires techniques</h2>
      <p>Pour faire fonctionner Chendam, nous utilisons :</p>
      <ul>
        <li><strong>Supabase :</strong> connexion, base de données et stockage des photos, vidéos et vocaux (serveurs à Francfort, en Allemagne).</li>
        <li><strong>Vercel :</strong> hébergement du site.</li>
        <li><strong>Les services de notification de ton navigateur</strong> (Google, Apple ou Mozilla), seulement si tu actives les notifications.</li>
      </ul>
      <p>Ces prestataires traitent les données pour notre compte et selon nos instructions. Tes données peuvent donc être traitées en dehors du Cameroun ; nous choisissons des prestataires qui protègent les données par des mesures de sécurité adaptées.</p>

      <h2>6. Combien de temps les gardons-nous ?</h2>
      <ul>
        <li>Tant que ton compte existe.</li>
        <li>Après ta demande de suppression, ton compte, tes articles, tes messages et tes fichiers sont supprimés dans un délai maximum de 30 jours, sauf si la loi impose de garder certaines informations (par exemple en cas d’enquête).</li>
        <li>Les journaux techniques sont conservés au maximum 12 mois.</li>
      </ul>

      <h2>7. Tes droits</h2>
      <p>Tu peux à tout moment :</p>
      <ul>
        <li>savoir quelles données nous avons sur toi et en obtenir une copie ;</li>
        <li>corriger tes informations (tu peux modifier ton nom, ta ville et ta photo dans ton profil) ;</li>
        <li>demander la suppression de ton compte et de tes données ;</li>
        <li>t’opposer à certains usages de tes données ou en demander la limitation ;</li>
        <li>retirer ton consentement, par exemple en désactivant les notifications.</li>
      </ul>
      <p>Pour exercer ces droits, écris à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> depuis l’adresse de ton compte. Nous te répondons dans un délai maximum de 30 jours. Si tu estimes que tes droits ne sont pas respectés, tu peux aussi saisir l’Autorité de protection des données à caractère personnel du Cameroun.</p>

      <h2>8. Comment protégeons-nous tes données ?</h2>
      <ul>
        <li>Le site fonctionne en connexion sécurisée (HTTPS).</li>
        <li>Les mots de passe sont chiffrés et ne sont jamais lisibles, même par nous.</li>
        <li>Chaque membre ne peut voir que ce que les règles du site lui permettent de voir : tes messages privés sont réservés à toi et à ton destinataire.</li>
        <li>L’accès administrateur demande un mot de passe et un code à 6 chiffres.</li>
        <li>Si une faille touchait tes données de façon grave, nous préviendrions les personnes concernées et les autorités, comme la loi l’exige.</li>
      </ul>

      <h2>9. Les enfants</h2>
      <p>Chendam est réservé aux personnes de 18 ans et plus. Si tu penses qu’un mineur s’est inscrit, écris-nous : nous supprimerons le compte.</p>

      <h2>10. Cookies et stockage dans ton navigateur</h2>
      <p>Nous n’utilisons ni cookies publicitaires, ni outils de suivi. Ton navigateur garde seulement une information technique qui te permet de rester connecté, et, si tu actives les notifications, l’identifiant de ton appareil.</p>

      <h2>11. Changements</h2>
      <p>Nous pouvons modifier cette politique, par exemple quand Chendam propose un nouveau service. La date en haut de la page indique la dernière mise à jour, et les changements importants sont annoncés sur le site.</p>

      <h2>12. Nous contacter</h2>
      <p><a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>
    </LegalShell>
  );
}
