'use client';
// Route seviyesi hata sınırı. Next.js App Router bunu ZORUNLU arar; yoksa
// "missing required error components, refreshing..." sonsuz yenileme döngüsü olur.
// Geliştirmede gerçek hata mesajını gösterir (asıl sorunu görebilmek için).

export default function Error({ error, reset }) {
  const dev = process.env.NODE_ENV !== 'production';
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
      <div style={{ maxWidth: 620 }}>
        <p
          style={{
            fontSize: 13,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--h-muted)',
            margin: '0 0 14px'
          }}
        >
          Bir şeyler ters gitti
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
          Sayfa yüklenemedi
        </h1>

        <p style={{ color: 'var(--h-ink2)', lineHeight: 1.65, margin: '0 0 26px' }}>
          Geçici bir sorun olabilir. Yeniden denemek ister misin?
        </p>

        {dev && error?.message && (
          <pre
            style={{
              textAlign: 'left',
              background: 'var(--h-cream)',
              border: '1px solid var(--h-border)',
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 12.5,
              lineHeight: 1.55,
              color: 'var(--h-ink2)',
              overflowX: 'auto',
              margin: '0 0 26px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
        )}

        <button
          onClick={() => reset()}
          style={{
            appearance: 'none',
            border: 0,
            cursor: 'pointer',
            background: 'var(--h-accent-text)',
            color: 'var(--h-accent-ink)',
            padding: '13px 26px',
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 600
          }}
        >
          Tekrar dene
        </button>
      </div>
    </main>
  );
}
