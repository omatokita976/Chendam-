import Link from "next/link";

export default function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="wrap legal">
      <header className="top">
        <div className="brandrow">
          <img src="/logo.webp" alt="" className="mark" />
          <div>
            <div className="logo">Chendam</div>
            <div className="stripe"><i /><i /><i /></div>
          </div>
        </div>
      </header>
      <h1 style={{ fontSize: 28, margin: "6px 0 12px" }}>{title}</h1>
      <article className="card">{children}</article>
      <p className="meta" style={{ textAlign: "center" }}>
        <Link href="/conditions">Conditions d’utilisation</Link> · <Link href="/confidentialite">Confidentialité</Link> · <Link href="/">Retour au site</Link>
      </p>
    </div>
  );
                  }

