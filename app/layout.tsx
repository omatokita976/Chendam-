import "./globals.css";
export const metadata = { title: "Chendam", description: "Vends. Achète. 100 % Cameroun." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0B6B3A" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Bricolage+Grotesque:wght@600;800&family=Nunito+Sans:wght@400;600;700&display=swap" />
      </head>
      <body>
        {children}
        {/* Écran de chargement : visible seulement tant qu'aucune page n'est affichée */}
        <div className="boot" aria-hidden="true"><img src="/logo.webp" alt="" className="bootlogo" /></div>
      </body>
    </html>
  );
          }
