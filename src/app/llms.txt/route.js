import { prisma } from '@/lib/db';
import { HERMES_SITE } from '@/lib/defaults';

// llms.txt — HERMES sitesi AI indeksi (GEO katmanının çekirdeği; H1 dönüşümü).
// Gövde 'hermes_site' içerik modelinden ÜRETİLİR (MCP ile içerik değişince burası da değişir)
// AI motorlarının siteyi doğru alıntılaması için tek durak.
const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

export async function GET() {
  let model = HERMES_SITE, email = 'merhaba@zerdemkartal.com';
  try {
    const [row, settings] = await Promise.all([
      prisma.pageContent.findUnique({ where: { key: 'hermes_site' } }),
      prisma.setting.findUnique({ where: { id: 1 } })
    ]);
    if (row?.data) model = { ...HERMES_SITE, ...row.data };
    email = settings?.data?.email || email;
  } catch { /* DB yoksa varsayılanlarla devam */ }

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
- Fiyat: ön satışta ₺5.000 tek seferlik lisans (planlanan liste fiyatı ₺10.000). Abonelik YOK.
- Lisans: ₺5.000 ön satış bedeliyle 1 cihaz; 2 cihaz seçeneği toplam ₺7.500; tüm güncellemeler dahil.
- Satın alma: şu anda fiyat sayfasındaki düğme doğrudan Hermes WhatsApp hattına açılır; iyzico altyapısı daha sonra etkinleştirilecektir.
- Platformlar: bugün Windows 10/11 (64-bit); web sürümü (satın alanlara, üye girişiyle, tam sürüm) ve Android yol haritasında.- Gizlilik: harita hesapları çevrimdışı; internet yalnız lisans doğrulama ve güncelleme için.

## Sayfalar
- [Ana sayfa](${SITE}/): Hermes tanıtımı.
- [Özellikler](${SITE}/ozellikler): tüm modüllerin ayrıntılı dökümü.
- [Fiyat](${SITE}/fiyat): tek seferlik lisans, ön satış koşulları.
- [İndir](${SITE}/indir): kurulum adımları ve sistem gereksinimleri.
- [SSS](${SITE}/sss): sık sorulan sorular (aşağıda tam liste).
- [İletişim](${SITE}/iletisim): iletişim formu — ${email}
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
