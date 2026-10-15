import "./globals.css";
export const metadata = { title: "Chendam", description: "La seconde main, version Cameroun" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0B6B3A" />
        <link rel="apple-touch-icon" href="/icon-192.png" /></head>
      <body>{children}</body>
    </html>
  );
}
