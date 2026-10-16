const PHRASES = [
  "Chendam : donne une seconde vie à tes affaires",
  "Vends vite, achète malin, 100 % Cameroun",
  "Ce qui ne te sert plus fait le bonheur d'un voisin",
  "Du quartier à tout le pays : le marché de confiance",
  "Publie en une minute, vends en un message",
];

// Phrases répétées deux fois pour que le défilement ne s'arrête jamais
export default function Marquee() {
  const items = [...PHRASES, ...PHRASES];
  return (
    <section className="marquee" aria-label={PHRASES[0]}>
      <span className="track" aria-hidden="true">
        {items.map((t, i) => <span key={i}>{t}<b>✦</b></span>)}
      </span>
    </section>
  );
}
