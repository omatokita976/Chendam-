"use client";
import { useState } from "react";

// Image d’un article pour adultes : floutée tant qu’on ne la touche pas (et qu’on confirme avoir 18 ans)
export default function AdultImage({ src, alt, adult, className, style }: {
  src: string; alt: string; adult?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const [show, setShow] = useState(false);
  if (!adult || show) return <img src={src} alt={alt} className={className} style={style} />;
  const reveal = () => {
    if (window.confirm("Ce contenu est réservé aux adultes (18 ans et plus). Tu as 18 ans ou plus ?")) setShow(true);
  };
  return (
    <button type="button" className={(className ? className + " " : "") + "adult-wrap"} style={style} onClick={reveal}
      aria-label="Contenu pour adultes : touche pour afficher l’image">
      <img src={src} alt="" />
      <span className="adult-badge">🔞 Contenu pour adultes<small>Touche pour voir</small></span>
    </button>
  );
}
