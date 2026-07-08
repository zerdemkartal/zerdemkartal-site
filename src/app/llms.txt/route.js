import { prisma } from '@/lib/db';

// llms.txt — dinamik AI indeksi (kök llms.txt prototip dosyasının deploy karşılığı).
// Sabit gövde + DB'den güncel analiz kataloğu ve son blog yazıları.
const SITE = (process.env.SITE_URL || 'https://zerdemkartal.com').replace(/\/$/, '');

export async function GET() {
  const [dan, posts, settings] = await Promise.all([
    prisma.pageContent.findUnique({ where: { key: 'danismanlik' } }),
    prisma.blogNode.findMany({
      where: { type: 'page', status: 'published' },
      orderBy: { date: 'desc' }, take: 10,
      select: { id: true, title: true, excerpt: true }
    }),
    prisma.setting.findUnique({ where: { id: 1 } })
  ]);

  const email = settings?.data?.email || 'merhaba@zerdemkartal.com';
  const insta = settings?.data?.instagram || 'https://instagram.com/zerdemkartal';
  const yt = settings?.data?.youtube || 'https://youtube.com/@zerdemkartal';

  const katalog = (dan?.data?.analiz?.groups || [])
    .map((g) => `- ${g.cat}: ` + (g.items || []).map((a) => `${a.n} (${a.t})`).join(' · '))
    .join('\n');

  const sonYazilar = posts
    .map((p) => `- [${p.title}](${SITE}/blog/yazi/${p.id})${p.excerpt ? ': ' + p.excerpt : ''}`)
    .join('\n');

  const txt = `# zerdemkartal

> Gökyüzünü senin dilinde okuyan bağımsız bir astroloji stüdyosu. Birebir astroloji danışmanlığı (online, kayıtlı, %100 gizli), AstroPen masaüstü astroloji programı, flash kartlarla ücretsiz astroloji çalışma aracı (Astroloji 101), ücretsiz doğum haritası hesaplayıcı ve gökyüzü günlüğü blog'u. Türkçe. İstanbul merkezli, dünyanın her yerine online hizmet.

Yaklaşım: Astroloji burada bir kehanet değil; kaderi değil olasılığı okuyan, korkutmadan ve etiketlemeden, haritayı gerçek hayata bağlayan bir dildir. 9+ yıl deneyim, 500+ birebir seans.

## Danışmanlıklar
Birebir, online astroloji seansları. Her analiz öncesinde harita hazırlanır, seans sonrasında kaydı danışanla paylaşılır. Randevu 24 saat öncesine kadar ücretsiz ertelenebilir.

- [Danışmanlıklar](${SITE}/danismanliklar): analiz kataloğu, süreç, sık sorulanlar ve randevu.

Analiz kataloğu (kategori · analiz · süre):
${katalog || '- (katalog: ' + SITE + '/danismanliklar)'}

## Programlar
- [AstroPen](${SITE}/programlar): Doğum haritası, transit takvimi, retro uyarıları, sinastri ve günlük gökyüzü notları sunan ücretsiz masaüstü astroloji programı (Windows, macOS).
- [Hermes Astroloji Programı](${SITE}/programlar/hermes): Profesyoneller için masaüstü astroloji programı (tek seferlik lisans).

## Astroloji 101
- [Astroloji 101](${SITE}/astroloji-101): Ücretsiz, kendi hızında astroloji çalışma aracı. Flash kartlar, aralıklı tekrar (SRS), çoktan seçmeli test, glif eşleştirme oyunu ve seviye testi. Konular: 12 burç, gezegenler, 12 ev, açılar, element & nitelikler, asaletler. Her kart kütüphanedeki tam yazıya bağlanır.

## Araçlar
- [Doğum Haritası](${SITE}/dogum-haritasi): Tarih, saat ve yer ile gerçek astronomik hesaplama; çark, gezegen tablosu ve kısa Türkçe yorum. Placidus ev sistemi, tropikal zodyak.

## Blog
- [Blog](${SITE}/blog): Astroloji, zanaat ve gündelik hayat üzerine kişisel günlük; transit notları, retro rehberleri ve gökyüzünden haftalık okumalar.

Son yazılar:
${sonYazilar || '- (yakında)'}

## Hakkında & İletişim
- [Hakkımda](${SITE}/hakkimda): Stüdyo ve astrolog hakkında.
- [İletişim](${SITE}/iletisim): İletişim formu — danışmanlık, programlar ve iş birliği soruları.
- E-posta: ${email}
- Instagram: ${insta}
- YouTube: ${yt}

## Yasal
- [KVKK Aydınlatma Metni](${SITE}/yasal/kvkk)
- [Gizlilik & Çerez Politikası](${SITE}/yasal/gizlilik)
- [Mesafeli Satış Sözleşmesi](${SITE}/yasal/mesafeli-satis)
- [İptal & İade Koşulları](${SITE}/yasal/iade)
`;

  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
