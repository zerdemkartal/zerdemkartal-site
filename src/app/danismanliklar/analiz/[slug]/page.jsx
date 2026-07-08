// ANALİZ DERİN LİNKİ — /danismanliklar/analiz/[slug] (DanismanlikView._applyAnalizSeo portu).
// Prototipte hash route + kaydırma; üretimde gerçek URL: analize özel meta + JSON-LD, 404 desteği.
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { DANISMANLIK } from '@/lib/defaults';
import { SITE, LOGO, pageMeta, priceNum, analizSlugs } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;

async function find(slug) {
  const c = await getContent('danismanlik', DANISMANLIK);
  return { c, hit: analizSlugs(c).find((x) => x.slug === slug) || null };
}

export async function generateStaticParams() {
  const c = await getContent('danismanlik', DANISMANLIK);
  return analizSlugs(c).map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }) {
  const { hit } = await find(params.slug);
  if (!hit) return { title: 'Analiz bulunamadı' };
  const seo = hit.a.seo || {};
  return pageMeta({
    title: seo.title || `${hit.a.n} — Astroloji Danışmanlığı | zerdemkartal`,
    description: seo.description || hit.a.d || '',
    path: `/danismanliklar/analiz/${hit.slug}`,
    ogType: 'website',
    image: LOGO
  });
}

function buildJsonLd(hit) {
  const url = `${SITE}/danismanliklar/analiz/${hit.slug}`;
  const seo = hit.a.seo || {};
  const offer = { '@type': 'Offer', availability: 'https://schema.org/InStock', url };
  const num = priceNum(hit.a.p);
  if (num) { offer.price = num; offer.priceCurrency = 'TRY'; }
  const svc = { '@type': 'Service', '@id': url + '#service', name: seo.title || hit.a.n, serviceType: hit.a.n, category: hit.cat, url, areaServed: 'TR', description: seo.description || hit.a.d || '', provider: { '@type': 'Organization', '@id': SITE + '/#org', name: 'zerdemkartal' }, offers: offer, isPartOf: { '@id': SITE + '/danismanliklar#webpage' } };
  const crumb = { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Danışmanlıklar', item: SITE + '/danismanliklar' },
    { '@type': 'ListItem', position: 3, name: hit.a.n, item: url }
  ] };
  return { '@context': 'https://schema.org', '@graph': [crumb, svc] };
}

export default async function AnalizPage({ params }) {
  const { hit } = await find(params.slug);
  if (!hit) notFound();
  const a = hit.a;

  return (
    <main>
      <JsonLd data={buildJsonLd(hit)} />
      <Nav active="/danismanliklar" />

      <section style={{ ...sectionStyle, paddingTop: 64, maxWidth: 880 }}>
        <nav aria-label="breadcrumb" style={{ fontSize: 13.5, color: T.muted }}>
          <a href="/" style={{ color: T.muted, textDecoration: 'none' }}>Ana Sayfa</a> / <a href="/danismanliklar" style={{ color: T.muted, textDecoration: 'none' }}>Danışmanlıklar</a> / <span>{a.n}</span>
        </nav>
        <div style={{ ...kickerStyle, marginTop: 26 }}>{hit.cat}</div>
        <h1 style={h1Style}>{a.n}</h1>
        <p style={pStyle}>{a.d}</p>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 24, fontSize: 16 }}>
          {a.p && <span style={{ fontWeight: 700, fontSize: 22 }}>{a.p}</span>}
          {a.t && <span style={{ color: T.muted }}>{a.t}</span>}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 30, flexWrap: 'wrap' }}>
          <a href="/iletisim" style={{ background: T.dark, color: '#F5F1E6', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600 }}>Randevu al</a>
          <a href={`https://wa.me/905454564275?text=${encodeURIComponent((a.n || 'Danışmanlık') + ' için randevu almak istiyorum.')}`} target="_blank" rel="noopener" style={{ background: '#25D366', color: '#FFFFFF', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600 }}>WhatsApp'tan yaz</a>
          <a href={`/danismanliklar#analiz-${hit.slug}`} style={{ border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '14px 28px', textDecoration: 'none' }}>Tüm analizler</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
