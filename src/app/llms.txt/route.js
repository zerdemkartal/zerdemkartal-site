import { prisma } from '@/lib/db';
import { HERMES_SITE } from '@/lib/defaults';
import { migrateHermesPricing } from '@/lib/hermesPricing';
import { CONTACT_EMAIL } from '@/lib/site';

// llms.txt — HERMES sitesi AI indeksi (GEO katmanının çekirdeği; H1 dönüşümü).
// Gövde 'hermes_site' içerik modelinden ÜRETİLİR (MCP ile içerik değişince burası da değişir)
// AI motorlarının siteyi doğru alıntılaması için tek durak.
const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

export async function GET() {
  let model = HERMES_SITE;
  try {
    const row = await prisma.pageContent.findUnique({ where: { key: 'hermes_site' } });
    if (row?.data) model = { ...HERMES_SITE, ...row.data };
  } catch { /* DB yoksa varsayılanlarla devam */ }
  model = migrateHermesPricing(model);

  const moduller = (model.ozellikler?.gruplar || [])
    .map((g) => `- ${g.baslik}: ` + (g.items || []).map((x) => x.ad).join(' · '))
    .join('\n');

  const sss = (model.sss?.items || [])
    .map((x) => `- S: ${x.q}\n  C: ${x.a}`)
    .join('\n');

  const txt = `# Hermes — Profesyonel Masaüstü Astroloji Programı

> Hermes, profesyonel kullanım için geliştirilmiş Türkçe masaüstü astroloji programıdır (Windows 10/11).
> Doğum haritası, transit, ilerletme, dönem teknikleri, tutulmalar, sinastri, horary, elektif tarama,
> rektifikasyon, astrokartografi, Uranyen dial ve danışan yönetimi tek uygulamada.
> Hesap motoru Swiss Ephemeris kullanır; danışan verileri kullanıcının cihazında kalır (bulut zorunluluğu yok).
> Geliştirici: zerdemkartal (bağımsız astroloji atölyesi, İstanbul). Dil: Türkçe.

Temel gerçekler:
- Fiyat: ön satışta ₺6.000 tek seferlik lisans; program fiyatı ₺8.500. Fiyatlara KDV dahildir. Abonelik YOK.
- Lisans: ₺6.000 ön satış bedeliyle 1 cihaz; ikinci cihaz lisansı +₺2.500, iki cihaz toplam ₺8.500; tüm güncellemeler dahil.
- Satın alma: fiyat sayfasındaki Satın Al düğmesi ad, soyad, e-posta, telefon ve lisans seçiminin iletildiği güvenli talep sayfasını açar. Talep Hermes Posta Merkezi’ne düşer; ödeme ve lisans teslimi e-posta veya WhatsApp üzerinden netleştirilir.
- Platformlar: bugün Windows 10/11 (64-bit); web sürümü (satın alanlara, üye girişiyle, tam sürüm) ve Android yol haritasında.- Gizlilik: harita hesapları çevrimdışı; internet yalnız lisans doğrulama ve güncelleme için.

## Sayfalar
- [Ana sayfa](${SITE}/): Hermes tanıtımı.
- [Özellikler](${SITE}/ozellikler): tüm modüllerin ayrıntılı dökümü.
- [Fiyat](${SITE}/fiyat): tek seferlik lisans, ön satış koşulları.
- [Satın Al](${SITE}/satin-al): lisans seçimi ve satın alma talep formu.
- [İndir](${SITE}/indir): kurulum adımları ve sistem gereksinimleri.
- [SSS](${SITE}/sss): sık sorulan sorular (aşağıda tam liste).
- [İletişim](${SITE}/iletisim): iletişim formu — ${CONTACT_EMAIL}
- [Geliştirici hakkında](${SITE}/hakkimda)

## Modüller
${moduller}

## Sık sorulan sorular (tam metin)
${sss}

## Yasal
- [KVKK](${SITE}/yasal/kvkk) · [Gizlilik & Çerez](${SITE}/yasal/gizlilik) · [Mesafeli Satış](${SITE}/yasal/mesafeli-satis) · [İptal & İade](${SITE}/yasal/iade)
`;

  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
