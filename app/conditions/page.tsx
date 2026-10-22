import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Conditions d’utilisation — Chendam" };

export default function Conditions() {
  return (
    <LegalShell title="Conditions d’utilisation">
      <p className="stamp">Dernière mise à jour : {LEGAL.maj}</p>
      <p>Bienvenue sur Chendam. En créant un compte ou en utilisant le site, tu acceptes ces conditions. Elles sont écrites simplement : lis-les jusqu’au bout.</p>

      <h2>1. Qui sommes-nous ?</h2>
      <p>Chendam est un site de petites annonces d’articles d’occasion, accessible sur {LEGAL.site}. Il est édité par <strong>{LEGAL.editeur}</strong>, établi à {LEGAL.ville} (Cameroun). Contact : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.</p>

      <h2>2. Ce que Chendam fait, et ce qu’il ne fait pas</h2>
      <p>Chendam met en relation des particuliers : ils publient des articles, se contactent par messages et s’ajoutent en amis.</p>
      <ul>
        <li>Chendam n’est ni vendeur, ni acheteur, ni intermédiaire de paiement.</li>
        <li>Le prix, le paiement (par exemple Mobile Money ou espèces) et la remise de l’article se règlent directement entre l’acheteur et le vendeur, hors du site.</li>
        <li>Chendam ne garantit ni l’existence, ni la qualité, ni la légalité des articles proposés.</li>
        <li>Pour le moment, Chendam ne prend aucune commission sur les ventes.</li>
      </ul>

      <h2>3. Ton compte</h2>
      <ul>
        <li>Tu dois avoir au moins 18 ans.</li>
        <li>Tu t’inscris avec une adresse Gmail qui est bien la tienne et un mot de passe d’au moins 8 caractères.</li>
        <li>Les informations de ton profil doivent être exactes. Un seul compte par personne.</li>
        <li>Tu es responsable de ton compte et de ton mot de passe. Ne les prête à personne. Si tu penses que quelqu’un utilise ton compte, préviens-nous tout de suite.</li>
        <li>Nous pouvons refuser une inscription ou suspendre un compte qui ne respecte pas ces conditions.</li>
      </ul>

      <h2>4. Publier un article</h2>
      <ul>
        <li>Chaque article doit avoir une photo réelle, un titre clair, un prix en FCFA, un état et une ville honnêtes.</li>
        <li>Tu ne publies que ce que tu as le droit de vendre.</li>
        <li>Sont interdits : les armes et munitions, les drogues, les produits volés ou contrefaits, les médicaments, les animaux et espèces protégés (ivoire, pangolin, etc.), les faux documents, la pornographie, les images de nudité ou de sexe explicite, les services sexuels ou d’escorte, tout contenu impliquant des mineurs, les données personnelles d’autres personnes, et tout article dont la vente est interdite par la loi camerounaise.</li>
        <li>Les articles pour adultes (par exemple jouets intimes, cartes érotiques, lingerie) sont tolérés à trois conditions : tu coches « Article pour adultes » en publiant, ce qui floute la photo tant qu’on ne la touche pas ; la photo montre l’objet seul, sans personne nue ni image explicite ; et le site reste réservé aux personnes de 18 ans et plus. Nous pouvons flouter, refuser ou retirer toute annonce de ce type.</li>
        <li>Nous pouvons retirer sans préavis toute publication qui ne respecte pas ces règles.</li>
      </ul>

      <h2>5. Comportement sur Chendam</h2>
      <p>Sont interdits, dans les publications, les commentaires et les messages privés :</p>
      <ul>
        <li>les arnaques, les faux articles, l’usurpation d’identité ;</li>
        <li>le harcèlement, les menaces, les insultes ;</li>
        <li>les propos haineux ou discriminatoires (tribalisme, racisme, sexisme, etc.) ;</li>
        <li>les contenus violents, choquants ou pornographiques ;</li>
        <li>le spam, la publicité non autorisée, la collecte des données des autres membres ;</li>
        <li>toute tentative de piratage ou de contournement du site.</li>
      </ul>

      <h2>6. Acheter et vendre en sécurité</h2>
      <p>Chaque vente est un accord entre l’acheteur et le vendeur. Voici nos conseils :</p>
      <ul>
        <li>Rencontre-toi de jour, dans un lieu public et fréquenté.</li>
        <li>Vérifie et essaie l’article avant de payer.</li>
        <li>Paie à la remise de l’article, pas à l’avance. Méfie-toi de ceux qui demandent des « frais de livraison » ou un acompte.</li>
        <li>Ne donne jamais ton code secret Mobile Money, ni un code reçu par SMS.</li>
        <li>Méfie-toi des prix trop bas et des personnes qui te pressent. En cas de doute, signale le compte.</li>
        <li>En cas d’escroquerie, adresse-toi aussi à la police ou à la gendarmerie.</li>
      </ul>
      <p>Les litiges se règlent entre les personnes concernées. Chendam peut suspendre un compte abusif, mais ne rembourse pas et ne tranche pas les litiges entre membres.</p>

      <h2>7. Signalements et modération</h2>
      <ul>
        <li>Le bouton « Signaler » permet d’indiquer un motif et d’envoyer des captures d’écran comme preuves.</li>
        <li>Nous examinons les signalements. Nous pouvons supprimer un contenu, avertir un membre, ou suspendre ou bannir un compte, de façon temporaire ou définitive. En cas de faute grave, cela peut se faire sans préavis.</li>
        <li>Si tu penses qu’une décision est une erreur, écris-nous avec le nom de ton compte : nous réexaminons ta situation.</li>
        <li>Les faux signalements répétés peuvent entraîner une suspension.</li>
      </ul>

      <h2>8. Ton contenu et nos droits</h2>
      <ul>
        <li>Tes photos, textes et messages restent à toi.</li>
        <li>Tu nous autorises, gratuitement et sans exclusivité, à les héberger, les afficher et les transmettre dans Chendam, tant qu’ils y sont présents, pour faire fonctionner le service.</li>
        <li>Tu garantis avoir le droit de publier ce que tu envoies (photos prises par toi ou avec l’accord de leur auteur, personnes reconnaissables avec leur accord).</li>
        <li>Le nom, le logo, le graphisme, les textes et le code de Chendam appartiennent à son éditeur. Ne les copie pas sans accord écrit.</li>
      </ul>

      <h2>9. Responsabilité</h2>
      <ul>
        <li>Le service est fourni « tel quel » : il peut être interrompu ou contenir des erreurs, sans que nous puissions garantir qu’il fonctionne toujours.</li>
        <li>Dans la limite permise par la loi, nous ne sommes pas responsables des pertes, arnaques ou litiges entre membres, ni de la qualité, de la sécurité ou de la légalité des articles.</li>
        <li>Ces limites ne s’appliquent pas en cas de faute lourde ou intentionnelle de notre part, et elles ne retirent aucun des droits que la loi te reconnaît.</li>
        <li>Tu es responsable de ce que tu publies et de la façon dont tu utilises le site.</li>
      </ul>

      <h2>10. Tes données personnelles</h2>
      <p>La manière dont nous utilisons tes données est expliquée dans notre <a href="/confidentialite">Politique de confidentialité</a>.</p>

      <h2>11. Options payantes à venir</h2>
      <p>Plus tard, Chendam pourra proposer des options payantes (par exemple des articles mis en avant) ou de la publicité. Tu en seras informé avant, et ces conditions seront mises à jour.</p>

      <h2>12. Arrêter, modifier</h2>
      <ul>
        <li>Tu peux arrêter d’utiliser Chendam quand tu veux. Pour supprimer ton compte, écris-nous par e-mail : ton compte et tes contenus seront supprimés comme expliqué dans la Politique de confidentialité.</li>
        <li>Nous pouvons faire évoluer le service et ces conditions. Les changements importants sont annoncés sur le site. Si tu continues à l’utiliser après, tu les acceptes ; sinon, demande la suppression de ton compte.</li>
      </ul>

      <h2>13. Loi applicable et litiges</h2>
      <p>Ces conditions sont régies par le droit camerounais. En cas de désaccord avec Chendam, écris-nous d’abord pour chercher une solution à l’amiable. À défaut, les tribunaux compétents du Cameroun, dans le ressort de {LEGAL.ville}, seront saisis.</p>

      <h2>14. Nous contacter</h2>
      <p><a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>
    </LegalShell>
  );
}
