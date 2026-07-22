'use client';
// Kök layout'un KENDİSİ patlarsa devreye giren son çare sınırı.
// Layout render olmadığı için kendi <html>/<body>'sini taşımak ZORUNDA —
// bu yüzden --h-* değişkenleri yoktur, renkler bilinçli olarak literal.

export default function GlobalError({ error, reset }) {
  const dev = process.env.NODE_ENV !== 'production';
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          background: '#FBFAF7',
          color: '#2B1D12',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '80px 24px',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, margin: '0 0 14px' }}>
            Beklenmedik bir hata
          </h1>

          <p style={{ color: '#3A2D20', lineHeight: 1.65, margin: '0 0 26px' }}>
            Uygulama açılırken sorun çıktı.
          </p>

          {dev && error?.message && (
            <pre
              style={{
                textAlign: 'left',
                background: '#F4F1E8',
                border: '1px solid #E8E3D6',
                borderRadius: 10,
                padding: '14px 16px',
                fontSize: 12.5,
                lineHeight: 1.55,
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
              background: '#6B4FA0',
              color: '#F5F1E6',
              padding: '13px 26px',
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
