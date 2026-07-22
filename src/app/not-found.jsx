// 404 sayfası. App Router bunu kök seviyede arar.
import Link from 'next/link';

export const metadata = {
  title: 'Sayfa bulunamadı | Hermes',
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '80px 24px',
        textAlign: 'center'
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <p
          style={{
            fontSize: 13,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--h-muted)',
            margin: '0 0 14px'
          }}
        >
          404
        </p>

        <h1
          style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 34,
            lineHeight: 1.2,
            color: 'var(--h-ink)',
            margin: '0 0 14px'
          }}
        >
          Bu sayfa yok
        </h1>

        <p style={{ color: 'var(--h-ink2)', lineHeight: 1.65, margin: '0 0 28px' }}>
          Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'var(--h-accent-text)',
            color: 'var(--h-accent-ink)',
            padding: '13px 26px',
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
