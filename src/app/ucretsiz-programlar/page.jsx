import { Footer, Nav, T, h1Style, kickerStyle, pStyle } from '@/components/Chrome';
import { JsonLd } from '@/components/JsonLd';
import { FREE_PROGRAMS } from '@/lib/freePrograms';
import { ORG, SITE, WEBSITE, pageMeta } from '@/lib/site';
import styles from './ucretsiz-programlar.module.css';

const PATH = '/ucretsiz-programlar';
const DESCRIPTION = 'Hermes atölyesinin Windows için ücretsiz yardımcı programları: AstroPen ve Asteroid Yardımcı.';

export const metadata = pageMeta({
  title: 'Ücretsiz Programlar | Hermes',
  description: DESCRIPTION,
  path: PATH
});

function ProgramMark({ id }) {
  return id === 'astropen' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 19.5 8.5 18l10-10a2.1 2.1 0 0 0-3-3l-10 10L4 19.5Z" strokeLinejoin="round" />
      <path d="m13.8 6.2 3 3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-24 12 12)" />
      <circle cx="19.2" cy="8.1" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function jsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ORG,
      WEBSITE,
      {
        '@type': 'CollectionPage',
        '@id': `${SITE}${PATH}#webpage`,
        url: `${SITE}${PATH}`,
        name: 'Ücretsiz Programlar',
        description: DESCRIPTION,
        inLanguage: 'tr-TR',
        isPartOf: { '@id': `${SITE}/#site` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: FREE_PROGRAMS.map((program, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'SoftwareApplication',
              name: program.name,
              softwareVersion: program.version,
              operatingSystem: 'Windows 10/11',
              applicationCategory: 'UtilitiesApplication',
              description: program.description,
              ...(program.downloadUrl ? { downloadUrl: program.downloadUrl } : {}),
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }
            }
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Ücretsiz Programlar', item: `${SITE}${PATH}` }
        ]
      }
    ]
  };
}

export default function UcretsizProgramlar() {
  return (
    <main>
      <JsonLd data={jsonLd()} />
      <Nav active={PATH} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div style={kickerStyle}>HERMES ATÖLYESİ · ÜCRETSİZ ARAÇLAR</div>
          <h1 style={{ ...h1Style, marginTop: 14 }}>Çalışma masanız için iki yardımcı.</h1>
          <p style={{ ...pStyle, maxWidth: 700, margin: '18px auto 0' }}>
            Hesap veya lisans anahtarı istemeden kullanabileceğiniz Windows araçlarını buradan indirebilirsiniz.
            Her program kendi başına çalışır; Hermes lisansı gerektirmez.
          </p>
        </div>
      </section>

      <section className={styles.grid} aria-label="Ücretsiz programlar">
        {FREE_PROGRAMS.map((program) => (
          <article className={styles.card} key={program.id}>
            <div className={styles.cardTop}>
              <span className={styles.mark}><ProgramMark id={program.id} /></span>
              <span className={styles.version}>SÜRÜM {program.version}</span>
            </div>
            <div style={{ ...kickerStyle, marginTop: 24 }}>{program.eyebrow}</div>
            <h2 className={styles.title}>{program.name}</h2>
            <p className={styles.description}>{program.description}</p>
            <ul className={styles.facts}>
              {program.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
            <p className={styles.trust}>{program.trust}</p>
            <div className={styles.actions}>
              {program.downloadUrl ? (
                <a className={styles.download} href={program.downloadUrl} rel="nofollow">ZIP'i indir</a>
              ) : (
                <>
                  <span className={styles.pending} aria-disabled="true">
                    {program.clearancePending ? 'Dağıtım izni doğrulanıyor' : 'İndirme bağlantısı hazırlanıyor'}
                  </span>
                  <p className={styles.pendingNote}>
                    {program.clearancePending
                      ? 'Arşiv içeriğinin dağıtım koşulları tamamlanınca bağlantı açılacak.'
                      : 'Dosya güvenli indirme alanına alındığında bu düğme etkinleşecek.'}
                  </p>
                </>
              )}
              <p className={styles.checksum}><strong>SHA-256</strong><br />{program.sha256}</p>
            </div>
          </article>
        ))}
      </section>

      <aside className={styles.note}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 10.5v6M12 7.5h.01" strokeLinecap="round" />
        </svg>
        <p><strong style={{ color: T.ink }}>Kurulum notu:</strong> İndirdiğiniz ZIP'i açıp içindeki kurulum dosyasını çalıştırın. Asteroid Yardımcı, geniş arşivi nedeniyle büyük bir indirmedir ve Hermes'in çalışması için zorunlu değildir.</p>
      </aside>

      <Footer />
    </main>
  );
}
