// Kök layout — fontlar + gövde sıfırlamaları. Nav/Footer her sayfada
// src/components/Chrome.jsx'ten çağrılır (aktif link vurgusu sayfaya özel).
export const metadata = {
  title: 'zerdemkartal',
  icons: { icon: '/assets/favicon.png' }
};

const GLOBAL_CSS = `
  html { scroll-behavior: smooth; }
  ::selection { background: #E4DAF6; color: #2B1D12; }
  a { color: #8E7CC3; }
  a:hover { color: #6B4FA0; }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: '#FBFAF7', color: '#2B1D12', fontFamily: "'Hanken Grotesk', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Hanken+Grotesk:ital,wght@0,400..700;1,400&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        {children}
      </body>
    </html>
  );
}
