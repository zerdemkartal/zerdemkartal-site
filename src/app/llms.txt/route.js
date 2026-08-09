import { prisma } from '@/lib/db';
import { HERMES_SITE } from '@/lib/defaults';
import { migrateHermesPricing } from '@/lib/hermesPricing';
import { migrateHermesFeatures, countHermesFeatures } from '@/lib/hermesFeatures.mjs';
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
  model = migrateHermesPricing(migrateHermesFeatures(model));

  const alanSayisi = (model.ozellikler?.gruplar || []).length;
  const ozellikSayisi = countHermesFeatures(model.ozellikler?.gruplar || []);

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
- Fiyat: EFT/Havale ile 1 cihaz ₺6.000; ikinci cihaz +₺2.500, iki cihaz toplam ₺8.500. Kartla tek çekim fiyatı PayTR’nin güncel mağaza oranına göre otomatik hesaplanır. Taksitli toplam PayTR ekranında karta ve vadeye göre değişebilir. Fiyatlara KDV dahildir.
- Lisans: Program lisansı tek seferliktir. Her lisans yalnız etkinleştirildiği bir cihazda geçerlidir; farklı veya ikinci cihaz ayrı lisans gerektirir. Aynı cihaz için yayımlanan güncellemeler dahildir.
- Satın alma: Hermes satın alma sayfası yalnız plan ve ödeme yöntemini seçtirir; ad, e-posta, telefon, adres, TCKN/VKN, fatura veya kart bilgisi toplamaz. Kartlı ödeme PayTR’nin güvenli sayfasında tamamlanır; Hermes/Vercel tarafında yalnız anonim ödeme mutabakatı tutulur. EFT/Havale bilgisi WhatsApp üzerinden istenir.
- Platformlar: Windows 10/11 (64-bit) şimdi kullanılabilir. macOS sürümü 17 Ağustos 2026’da sunulacaktır. Android, iPhone ve iPad sürümleri daha sonra gelecektir.
- Senkronizasyon: Cihazlar arası veri senkronizasyonu program lisansına dahil değildir; ileride isteğe bağlı ve ayrı bir abonelik hizmeti olarak sunulacaktır.
- Gizlilik: Harita hesapları çevrimdışı; internet yalnız lisans doğrulama ve güncelleme için.

## Sayfalar
- [Ana sayfa](${SITE}/): Hermes tanıtımı.
- [Özellikler](${SITE}/ozellikler): ${alanSayisi} ana çalışma alanındaki ${ozellikSayisi} çalışan araç ve özelliğin doğrulanmış dökümü.
- [Fiyat](${SITE}/fiyat): EFT/Havale ve PayTR kart fiyatlandırması, tek seferlik lisans.
- [Satın Al](${SITE}/satin-al): kişisel veri toplamadan lisans ve ödeme yöntemi seçimi.
- [İndir](${SITE}/indir): kurulum adımları ve sistem gereksinimleri.
- [SSS](${SITE}/sss): sık sorulan sorular (aşağıda tam liste).
- [İletişim](${SITE}/iletisim): iletişim formu — ${CONTACT_EMAIL}
- [Geliştirici hakkında](${SITE}/hakkimda)

## Modüller
${moduller}

## Sık sorulan sorular (tam metin)
${sss}

## Yasal
- [KVKK](${SITE}/yasal/kvkk) · [Gizlilik & Çerez](${SITE}/yasal/gizlilik) · [Ön Bilgilendirme](${SITE}/yasal/on-bilgilendirme) · [Teslimat](${SITE}/yasal/teslimat) · [Mesafeli Satış](${SITE}/yasal/mesafeli-satis) · [İptal & İade](${SITE}/yasal/iade)
`;

  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
