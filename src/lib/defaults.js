// Sayfa içerik varsayılanları — prototip Component.DEFAULT modellerinin SSR portu.
// DB (PageContent) boşsa sayfalar bunları basar; panel/MCP düzenledikçe DB üzerine biner.
// href'ler .dc.html yerine temiz rotalara çevrildi.

export const ANASAYFA = {
  seo: {
    title: 'zerdemkartal — Fala inanma, haritanı oku',
    description: 'Gökyüzünü senin dilinde okuyan astroloji stüdyosu: AstroPen masaüstü programı, birebir danışmanlık, eğitimler ve ücretsiz doğum haritası aracı.'
  },
  hero: {
    kicker: 'ZERDEMKARTAL · ASTROLOJİ STÜDYOSU',
    titleGray: 'Fala inanma, ',
    titleInk: 'haritanı oku.',
    paragraph: 'Gökyüzünü kadere teslim etmeden okuyoruz: birebir danışmanlık, masaüstü programlar, eğitimler ve ücretsiz doğum haritası aracı — hepsi senin dilinde.',
    slides: [
      { kicker: 'BİREBİR SEANSLAR', titleGray: 'Birebir ', titleInk: 'danışmanlık', paragraph: 'Haritanı birlikte okuyalım; sorularına, ilişkilerine ve zamanlamalarına gökyüzünden sakin, net yanıtlar.', btn: 'Danışmanlık al', href: '/danismanliklar', note: 'Online · 50–75 dk · Türkçe' },
      { kicker: 'HERMES ASTROLOJİ SUNAR', titleGray: 'Astro', titleInk: 'Pen', paragraph: 'Gökyüzünü senin dilinde yazan masaüstü astroloji programı — doğum haritan, transitler ve günlüğün tek kalemde.', btn: 'Programları keşfet', href: '/programlar', note: 'Windows ve macOS · ücretsiz indir' },
      { kicker: 'ÖĞREN', titleGray: 'Astroloji ', titleInk: 'eğitimleri', paragraph: 'Sıfırdan kendi haritanı okumaya; kendi hızında, canlı ve kayıtlı derslerle.', btn: 'Astroloji 101', href: '/astroloji-101', note: 'Ücretsiz · her seviye' },
      { kicker: 'GÜNCEL YAZILAR', titleGray: 'Gökyüzü ', titleInk: 'günlüğü', paragraph: 'Transit notları, retro rehberleri ve gökyüzünden haftalık okumalar — sade bir dille.', btn: 'Yazıları oku', href: '/blog', note: 'Haftalık transit & retro notları' }
    ]
  },
  uygulama: {
    kicker: 'HERMES ASTROLOJİ',
    title: 'Masaüstünde bir gökyüzü.',
    paragraph: 'Masaüstü programı AstroPen, doğum haritanı saniyeler içinde çıkarır; gökyüzünü izler ve olan biteni senin dilinde yazar.',
    features: ['Doğum haritası — yorumuyla birlikte, saniyeler içinde', 'Transit takvimi ve retro uyarıları', 'Günlüğün, gökyüzüyle hizalanır'],
    btn: 'Programı keşfet →',
    href: '/programlar',
    note: 'Ücretsiz başla'
  },
  danismanlik: {
    kicker: 'BİREBİR',
    title: 'Haritan, birlikte okununca konuşur.',
    paragraph: 'Sorularına, ilişkilerine ve zamanlamalarına gökyüzünden sakin, net yanıtlar — online, kayıtlı ve tamamen gizli.',
    stats: ['★ 4.9 / 5', '500+ birebir seans', '%100 gizli'],
    btn: 'Danışmanlıkları gör →',
    href: '/danismanliklar',
    cards: [
      { title: 'Doğum haritası okuması', sub: 'Haritanın bütünü — 60 dk', price: '₺1.200', feat: false },
      { title: 'İlişki okuması · Sinastri', sub: 'İki haritanın sohbeti — 75 dk', price: '₺1.800', feat: true },
      { title: 'Yıllık öngörü', sub: 'Önümüzdeki bir yılın haritası — 60 dk', price: '₺1.500', feat: false }
    ]
  },
  egitimler: {
    kicker: 'EĞİTİMLER',
    title: 'Gökyüzünü okumayı öğren',
    paragraph: 'Canlı dersler ve kayıtlarla, sıfırdan öngörü tekniklerine uzanan üç adım.',
    href: '/astroloji-101',
    cards: [
      { badge: 'BAŞLANGIÇ · 6 HAFTA', title: 'Astroloji 101', desc: 'Gezegenler, burçlar ve evler — haritanın alfabesi.', price: '₺1.900', feat: false },
      { badge: 'ORTA · 8 HAFTA', title: 'Doğum Haritası Atölyesi', desc: 'Gerçek haritalar üzerinde okuma pratiği ve sentez.', price: '₺2.900', feat: true },
      { badge: 'İLERİ · 6 HAFTA', title: 'Öngörü Teknikleri', desc: 'Transitler, progresyonlar ve güneş dönüşleri.', price: '₺3.400', feat: false }
    ]
  },
  blog: { title: 'Günlük', link: 'Tümünü oku →', href: '/blog' },
  haritaCta: {
    title: 'Haritanı şimdi çıkar — ücretsiz.',
    paragraph: 'Tarih, saat ve yer; çarkın, gezegen tabloların ve kısa Türkçe yorumun saniyeler içinde hazır.',
    btn: 'Doğum haritası aracı →',
    href: '/dogum-haritasi'
  },
  flow: {
    curve: 'gökyüzü bir harita, sen yolcusun ✳ merkür retrosu bitti, sözler yine bana ait ✳ yükselenim sabır, ayım merak',
    ribbon: 'bu hafta ay ikizlerde — konuş, yaz, sor ✦ venüs boğada — yavaşla, tadını çıkar ✦ mars koçta — bekleme, başla ✦ satürn balıkta — sınırlarını sev ✦ jüpiter yayda — büyük düşün ✦',
    tags: 'doğum haritası ✳ transit takvimi ✳ sinastri ✳ retro günlüğü ✳ öngörü raporları ✳ astroloji eğitimleri ✳'
  }
};

export const PROGRAMLAR = {
  seo: {
    title: 'Programlar — AstroPen & Hermes Astroloji Programı | zerdemkartal',
    description: "Hermes Astroloji'nin masaüstü programları: ücretsiz AstroPen ile hızlı doğum haritası ve günlük; profesyonel Hermes Astroloji Programı ile derin analiz, sinastri ve öngörü raporları. Windows & macOS."
  },
  hero: { kicker: 'HERMES ASTROLOJİ PROGRAMLARI', titleA: 'Gökyüzü, ', titleEm: 'masaüstünde.', paragraph: 'İki masaüstü uygulama: hızlı ve ücretsiz başlamak için AstroPen, derinlemesine çalışmak için Hermes Astroloji Programı.' },
  products: [
    { name: 'AstroPen', badge: 'ÜCRETSİZ', tagline: 'Hızlı doğum haritası, günlük gökyüzü özeti ve astro-günlük. Hafif, sade ve tamamen ücretsiz.', features: ['Hızlı doğum haritası ve kısa yorum', 'Günlük gökyüzü özeti', 'Astro-günlük · çevrimdışı çalışır'], price: 'Ücretsiz', oldPrice: '', priceNote: 'Her zaman ücretsiz · kayıt gerekmez', href: '/programlar/astropen', paid: false },
    { name: 'Hermes Astroloji Programı', badge: 'ÖN SATIŞ · %70', tagline: 'Derin harita analizi, sinastri, transit takvimi, öngörü raporları ve danışman araçları. Profesyonel masaüstü program.', features: ['Derinlemesine yorum + sinastri', 'Transit takvimi ve öngörü raporları (PDF)', 'Sınırsız profil · tek seferlik lisans'], price: '₺3.000', oldPrice: '₺9.999', priceNote: 'Tek seferlik · ömür boyu güncelleme', href: '/programlar/hermes', paid: true }
  ],
  presale: { kicker: 'HERMES · ÖN SATIŞ', title: 'Erken alana ₺3.000, yayında ₺9.999.', paragraph: 'Ön satış lisansı ömür boyu geçerli; çıkan tüm sürümler ve güncellemeler dahil. AstroPen ise her zaman ücretsiz.', btn: 'Ön siparişini oluştur' },
  compare: "Hangisi bana uygun? AstroPen'i ücretsiz dene, ihtiyacın büyüyünce Hermes'e geç."
};

export const DANISMANLIK = {
  seo: {
    title: 'Danışmanlıklar — Birebir Astroloji Seansları | zerdemkartal',
    description: 'Birebir astroloji danışmanlığı: doğum haritası, sinastri, yıllık öngörü ve 13 farklı analiz. Online, kayıtlı ve %100 gizli seanslar — randevu al.'
  },
  hero: {
    kicker: 'BİREBİR ASTROLOJİ DANIŞMANLIĞI',
    titleA: 'Haritan, birlikte ',
    titleEm: 'okununca',
    titleB: ' konuşur.',
    paragraph: 'Gökyüzünü kadere teslim etmeden; sorularına, ilişkilerine ve zamanlamalarına dair sakin, uygulanabilir bir okuma.',
    primaryBtn: 'Randevu al',
    secondaryBtn: 'Analizleri gör',
    stats: ['★ 4.9 / 5', '500+ birebir seans', '%100 gizli', 'online · Türkçe']
  },
  trust: [
    { big: '9+', small: 'yıl deneyim' },
    { big: '500+', small: 'birebir seans' },
    { big: '4.9★', small: 'memnuniyet' },
    { big: '%100', small: 'gizlilik' }
  ],
  analiz: {
    kicker: 'TÜM ANALİZLER',
    title: 'Hangi soruyla geldiysen.',
    paragraph: 'Her analiz online yapılır, öncesinde haritan hazırlanır, sonrasında kaydı seninle paylaşılır.',
    groups: [
      { cat: 'Temel okumalar', items: [
        { n: 'Doğum Haritası', d: 'Karakterin, potansiyelin ve yaşam temaların; haritanın bütününe sakin bir bakış.', p: '₺2.400', t: '90 dk', feat: true },
        { n: 'Yükselen & Persona', d: 'Dışa dönük yüzün, ilk izlenimin ve yaşam yönelimin.', p: '₺1.200', t: '45 dk', feat: false },
        { n: 'Ay Haritası & Duygular', d: 'Duygusal ihtiyaçların, güvenlik alanın ve içsel ritmin.', p: '₺1.200', t: '45 dk', feat: false }
      ]},
      { cat: 'İlişkiler', items: [
        { n: 'Sinastri · İlişki Uyumu', d: 'İki haritanın karşılaşması; çekim, gerilim ve büyüme alanları.', p: '₺2.900', t: '90 dk', feat: true },
        { n: 'Kompozit Harita', d: 'İlişkinin kendi haritası; birlikte kurduğunuz ortak alan.', p: '₺1.900', t: '60 dk', feat: false },
        { n: 'Aile & Bağlanma', d: 'Kök temaların, ebeveyn eksenleri ve tekrar eden örüntüler.', p: '₺1.900', t: '60 dk', feat: false }
      ]},
      { cat: 'Zamanlama & öngörü', items: [
        { n: 'Yıllık Öngörü · Solar Return', d: 'Önümüzdeki yılın temaları, fırsat pencereleri ve dikkat alanları.', p: '₺2.400', t: '75 dk', feat: true },
        { n: 'Transit & Progresyon', d: 'Şu an gökyüzünde olan biten; kararların için doğru zamanlama.', p: '₺2.100', t: '75 dk', feat: false },
        { n: 'Seçim Astrolojisi', d: 'Önemli bir başlangıç için en uygun anı birlikte seçelim.', p: '₺1.600', t: '45 dk', feat: false }
      ]},
      { cat: 'Özel çalışmalar', items: [
        { n: 'Astrokartografi', d: 'Yer ve harita; nerede hangi enerjiyle karşılaşırsın.', p: '₺2.100', t: '60 dk', feat: false },
        { n: 'Meslek & Yön', d: 'Kariyer ekseni, vokasyon ve görünürlük alanların.', p: '₺1.900', t: '60 dk', feat: false },
        { n: 'Rektifikasyon · Saat Düzeltme', d: 'Doğum saatini olaylardan yola çıkarak birlikte netleştirelim.', p: '₺2.600', t: '90 dk', feat: false },
        { n: 'Soru Haritası · Horary', d: 'Net bir soruya, sorulduğu anın haritasıyla yanıt.', p: '₺900', t: '30 dk', feat: false }
      ]}
    ]
  },
  surec: {
    title: 'Seans nasıl işler',
    steps: [
      { no: '01', title: 'Randevu & bilgi', desc: 'Uygun zamanı seç, doğum bilgini paylaş.' },
      { no: '02', title: 'Hazırlık', desc: 'Haritanı önceden çıkarır, sorularına göre hazırlanırım.' },
      { no: '03', title: 'Birebir seans', desc: 'Online görüşme; haritanı birlikte, sakince okuruz.' },
      { no: '04', title: 'Kayıt & notlar', desc: 'Görüşmenin kaydını ve not özetini seninle paylaşırım.' }
    ],
    gizlilikStrong: 'Gizlilik esastır.',
    gizlilikText: ' Paylaştığın hiçbir bilgi üçüncü kişilerle paylaşılmaz; kayıtlar yalnızca sana aittir (KVKK uyumlu).'
  },
  astrolog: {
    kicker: 'ASTROLOG',
    title: 'Kaderi değil, olasılığı okurum.',
    paragraph: 'Dokuz yılı aşkın süredir birebir danışmanlık veriyorum. Yöntemim; korkutmadan, etiketlemeden, haritanı senin gerçek hayatına bağlayarak okumak. Astroloji burada bir kehanet değil; kendini daha net görmen için bir dil.',
    tags: ['✳ Modern & geleneksel teknik', '✳ Türkçe kaynak & eğitim']
  },
  referanslar: {
    title: 'Seanstan sonra',
    items: [
      { quote: '“İlk defa haritamı korkmadan dinledim. Her şey çok netti, günlük hayatıma dokunuyordu.”', name: 'Elif K.', role: 'Doğum haritası' },
      { quote: '“İlişki okuması ikimiz için de bir aynaydı. Suçlama yok, anlama vardı.”', name: 'Mert & Deniz', role: 'Sinastri' },
      { quote: '“Taşınma kararımı astrokartografi ile verdim; şu an çok daha huzurluyum.”', name: 'Ayça T.', role: 'Astrokartografi' }
    ]
  },
  sss: {
    title: 'Sık sorulanlar',
    items: [
      { q: 'Seanslar online mı, yüz yüze mi?', a: 'Tüm seanslar online (görüntülü) yapılır; dünyanın her yerinden katılabilirsin.' },
      { q: 'Doğum saatimi bilmiyorum, olur mu?', a: 'Olur. Saatsiz de çalışırız; mümkünse yaklaşık saatle ya da rektifikasyonla birlikte netleştiririz.' },
      { q: 'Kayıt paylaşılıyor mu?', a: 'Evet. Görüşmenin kaydını ve kısa bir not özetini seansın ardından seninle paylaşırım.' },
      { q: 'İptal / yeniden planlama nasıl?', a: 'Randevunu 24 saat öncesine kadar ücretsiz yeniden planlayabilirsin.' },
      { q: 'Bilgilerim gizli mi?', a: 'Kesinlikle. Paylaştığın hiçbir bilgi üçüncü kişilerle paylaşılmaz (KVKK uyumlu).' }
    ]
  },
  cta: {
    title: 'Gökyüzün seni bekliyor.',
    paragraph: 'Uygun zamanı seç, doğum bilgini bırak — birkaç gün içinde birebir buluşalım.',
    primaryBtn: 'Randevu al',
    secondaryBtn: "Instagram'dan yaz",
    foot: 'Online · Türkçe · kayıt seninle paylaşılır · %100 gizli'
  }
};

export const PD_ASTROPEN = {
  seo: {
    title: 'AstroPen — Ücretsiz Masaüstü Astroloji Programı | zerdemkartal',
    description: 'AstroPen: doğum haritanı saniyeler içinde çıkaran, gökyüzünü senin dilinde yazan ücretsiz masaüstü astroloji programı. Windows ve macOS için.'
  },
  hero: {
    kicker: 'ÜCRETSİZ · MASAÜSTÜ UYGULAMA',
    title: 'AstroPen',
    p: 'Hızlı doğum haritası, günlük gökyüzü özeti ve astro-günlük — hepsi tek, sade ve ücretsiz bir masaüstü uygulamasında.',
    stat1: 'Tamamen ücretsiz',
    stat2: 'Kayıt gerektirmez',
    stat3: 'Çevrimdışı çalışır'
  },
  ozellik: {
    kicker: 'NELER YAPAR',
    title: 'Hafif, hızlı ve ücretsiz.',
    cards: [
      { glyph: '✦', title: 'Hızlı doğum haritası', desc: 'Tarih, saat ve yer gir; haritan ve kısa yorumu saniyeler içinde.' },
      { glyph: '☾', title: 'Günlük gökyüzü', desc: 'Bugün gökyüzünde ne var — sade, günlük bir özet.' },
      { glyph: '✳', title: 'Astro-günlük', desc: 'Notların, o günün gökyüzüyle hizalanır.' },
      { glyph: '↓', title: 'Ücretsiz & çevrimdışı', desc: 'Kurulumdan sonra internetsiz çalışır, hep ücretsiz.' }
    ]
  },
  adimlar: {
    title: 'Üç adımda başla',
    items: [
      { title: 'Ücretsiz indir', desc: 'Windows veya macOS için birkaç dakikada kurulur.' },
      { title: 'Doğum bilgini gir', desc: 'Tarih, saat ve yer — haritan hazır.' },
      { title: 'Günlüğüne dön', desc: 'Her gün gökyüzüyle hizalı notlar tut.' }
    ]
  },
  sistem: {
    title: 'Sistem gereksinimleri',
    win: ['Windows 10 / 11 (64-bit)', '4 GB RAM', '300 MB boş disk alanı'],
    mac: ['macOS 12 Monterey ve üzeri', 'Apple Silicon & Intel', '300 MB boş disk alanı']
  },
  sss: {
    title: 'Sık sorulanlar',
    items: [
      { q: 'AstroPen gerçekten ücretsiz mi?', a: 'Evet, AstroPen tamamen ücretsizdir; kart bilgisi ya da abonelik istemez.' },
      { q: "Hermes Astroloji Programı'ndan farkı ne?", a: 'AstroPen hızlı harita, günlük gökyüzü ve not için hafif bir uygulamadır. Hermes Astroloji Programı ise derin analiz, sinastri, öngörü raporları ve danışman araçları sunan profesyonel programdır.' },
      { q: "Windows ve macOS'ta çalışır mı?", a: 'Evet, hem Windows (10/11) hem macOS (12+) için ücretsiz sürümü vardır.' },
      { q: 'İnternet gerekli mi?', a: 'Kurulumdan sonra çevrimdışı çalışır; yalnızca güncellemeler için internet gerekir.' }
    ]
  },
  cta: { title: 'Gökyüzünü ücretsiz indir.', p: 'Kayıt yok, ücret yok — Windows ve macOS için hemen başla.' }
};

export const PD_HERMES = {
  seo: {
    title: 'Hermes Astroloji Programı — Profesyonel Masaüstü Yazılım | zerdemkartal',
    description: 'Hermes: profesyonel masaüstü astroloji programı. Doğum haritası, transitler, sinastri ve öngörü teknikleri — ön satışa özel tek seferlik lisans.'
  },
  hero: {
    kicker: 'HERMES ASTROLOJİ · PROFESYONEL PROGRAM',
    title: 'Hermes',
    p: 'Gökyüzünü izleyen, senin dilinde yazan masaüstü astroloji programı. Doğum haritan, transitlerin, sinastrin ve günlüğün — tek sakin ekranda.',
    stat1: '★ 4.9 / 5',
    stat2: 'Windows & macOS',
    stat3: 'Tek seferlik lisans'
  },
  ozellik: {
    kicker: 'ÖZELLİKLER',
    title: 'Gökyüzünü okumak için her şey',
    cards: [
      { glyph: '✦', title: 'Doğum haritası & yorum', desc: 'Gezegenler, evler ve açılar; hepsi akıcı Türkçe yorumuyla.' },
      { glyph: '☾', title: 'Transit takvimi', desc: 'Gökyüzü trafiği gün gün, kişisel uyarılarla.' },
      { glyph: '↺', title: 'Retro uyarıları', desc: 'Merkür, Venüs ve Mars retroları önceden haberinde.' },
      { glyph: '∞', title: 'Sinastri', desc: 'İki haritanın karşılaştırması — ilişkinin gökyüzü.' },
      { glyph: '✧', title: 'Öngörü raporları', desc: 'Aylık ve yıllık raporlar; PDF olarak dışa aktar.' },
      { glyph: '✳', title: 'Günlük & çevrimdışı', desc: 'Notların gökyüzüyle hizalanır; internetsiz de çalışır.' }
    ]
  },
  adimlar: {
    title: 'Üç adımda gökyüzün',
    items: [
      { title: 'İndir & kur', desc: 'Windows veya macOS için birkaç dakikada kurulur.' },
      { title: 'Doğum bilgini gir', desc: 'Tarih, saat ve yer — gerisini Hermes halleder.' },
      { title: 'Oku & günlüğe dön', desc: 'Haritanı Türkçe yorumla oku; her gün gökyüzüyle hizalan.' }
    ]
  },
  sistem: {
    title: 'Sistem gereksinimleri',
    win: ['Windows 10 / 11 (64-bit)', '4 GB RAM (8 GB önerilir)', '500 MB boş disk alanı', 'Kurulum & güncelleme için internet'],
    mac: ['macOS 12 Monterey ve üzeri', 'Apple Silicon & Intel', '4 GB RAM (8 GB önerilir)', '500 MB boş disk alanı']
  },
  fiyat: {
    kicker: 'ÖN SATIŞA ÖZEL',
    price: '₺3.000',
    oldPrice: '₺9.999',
    rows: ['✳ Tüm özellikler — sınırsız harita ve profil', '✳ Windows ve macOS sürümleri', '✳ 2 cihaza kadar tek lisans', '✳ Çıkan tüm güncellemeler dahil'],
    alt: 'Ödeme bağlantısı ön sipariş sonrası e-posta ile paylaşılır'
  },
  yorumlar: {
    title: 'Kullananlar ne diyor',
    items: [
      { quote: "Yıllardır farklı programlar denedim; Hermes'in Türkçe yorumu bambaşka bir netlik veriyor.", name: 'Selin A.', role: 'Astroloji öğrencisi' },
      { quote: 'Transit takvimi ve retro uyarıları günlük planımı bambaşka bir yere taşıdı.', name: 'Kaan T.', role: 'Hermes kullanıcısı' },
      { quote: 'Danışmanlık verirken haritaları saniyeler içinde çıkarıyorum; işimi çok hızlandırdı.', name: 'Derya M.', role: 'Danışman' }
    ]
  },
  sss: {
    title: 'Sık sorulanlar',
    items: [
      { q: 'Lisans tek seferlik mi?', a: 'Evet. Hermes tek seferlik satın alınır; abonelik yoktur, ömür boyu kullanırsın.' },
      { q: 'Güncellemeler ücretli mi?', a: 'Hayır. Çıkan tüm sürümler ve güncellemeler ömür boyu ücretsizdir.' },
      { q: 'Kaç cihazda kullanabilirim?', a: 'Bir lisans, aynı kişiye ait 2 cihaza kadar kullanılabilir.' },
      { q: 'Ön satış ne demek?', a: 'Program yayına hazırlanırken erken alanlar ₺3.000 özel fiyattan edinir; yayında liste fiyatı ₺9.999 olacaktır.' },
      { q: 'İnternet gerekli mi?', a: 'Kurulumdan sonra çevrimdışı çalışır; yalnızca güncellemeler için internet gerekir.' }
    ]
  },
  cta: { title: 'Gökyüzünü masaüstüne indir.', p: 'Ön satışa özel ₺3.000 — tek seferlik, ömür boyu senin.' }
};
