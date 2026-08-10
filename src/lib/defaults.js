// HERMES sitesi içerik varsayılanları — TEK anahtar: PageContent 'hermes_site'.
// Tüm sayfa metinleri buradan gelir; DB'de satır varsa bölüm bazında üstüne biner
// (sayfalarda shallow-merge). Claude MCP (icerik/sayfa_metni araçları, dot-path)
// ile TAMAMI yönetilebilir — kullanıcı kararı 2026-07-19: "her şeyi Claude MCP ile yönetecek".
// İçerik kaynağı: Hermes'in GERÇEK modülleri (C:\Hermes MIMARI.md / hermes.html nav).
// Kural: uydurma kullanıcı yorumu ve puan YOK (eski PD_HERMES'teki taklit yorumlar bilinçli atıldı).
// Not: metin içi kesmeler tipografik ’ — düz ' tek tırnaklı string'i kırar.

import { HERMES_FEATURE_GROUPS, HERMES_HOME_FEATURE_CARDS, HERMES_FEATURE_INVENTORY_VERSION, HERMES_FEATURE_METRICS } from './hermesFeatures.mjs';

export const HERMES_SITE = {
  seo: {
    home: {
      title: 'Hermes — Profesyonel Masaüstü Astroloji Programı',
      description: 'Hermes: doğum haritası, transit, sinastri, horary, rektifikasyon ve astrokartografi tek programda. Şu an Windows 10/11’de. Her lisans yalnız bir cihazda geçerlidir.'
    },
    ozellikler: {
      title: 'Özellikler — Hermes Astroloji Programı',
      description: `Hermes’in ${HERMES_FEATURE_METRICS.alan} ana çalışma alanındaki ${HERMES_FEATURE_METRICS.ozellik} çalışan aracı: harita, öngörü, sinastri, horary, rektifikasyon, lokasyon astrolojisi, Uranyen teknikler, danışan, rapor ve araştırma.`
    },
    fiyat: {
      title: 'Fiyat — Hermes | Tek seferlik cihaz lisansı',
      description: 'Hermes 1 cihaz EFT/Havale fiyatı ₺6.000; farklı veya ikinci cihaz için ayrı lisans gerekir. İkinci cihaz lisansı +₺2.500, iki cihaz toplam ₺8.500’dür.'
    },
    indir: {
      title: 'İndir — Hermes Astroloji Programı (Windows)',
      description: 'Hermes’i Windows 10/11 bilgisayarına kur. Sistem gereksinimleri, kurulum adımları ve güncel sürüm bilgisi.'
    },
    sss: {
      title: 'Sık Sorulan Sorular — Hermes Astroloji Programı',
      description: 'Hermes hakkında merak edilenler: cihaz lisansı, ödeme, güncellemeler, çevrimdışı çalışma, veri gizliliği, platform yol haritası ve senkronizasyon.'
    }
  },

  home: {
    hero: {
      kicker: 'HERMES ASTROLOJİ PROGRAMI',
      title: 'Gökyüzü, masaüstünde.',
      p: 'Hermes; doğum haritasından horary’ye, rektifikasyondan astrokartografiye profesyonel bir astroloji atölyesini tek sakin ekranda toplar. Hesaplar Swiss Ephemeris hassasiyetinde, yorum dili Türkçe, verilerin ise yalnız senin cihazında.',
      btn1: 'Programı keşfet', btn1Href: '/ozellikler',
      btn2: 'Satın al', btn2Href: '/satin-al',
      stats: ['Windows 10/11', 'Tek seferlik lisans', 'Çevrimdışı çalışır'],
      doner: [
        'Kendi astroloji kütüphaneniz programın içinde, her an el altında olsun ister misiniz?',
        'Doğum haritasından horary’ye, tüm teknikler tek sakin ekranda buluşsun ister misiniz?',
        'Danışan verileriniz buluta değil, yalnız sizin cihazınızda kalsın ister misiniz?'
      ]
    },
    moduller: {
      kicker: `${HERMES_FEATURE_METRICS.alan} ANA ÇALIŞMA ALANI`,
      title: 'Bir astroloğun masasındaki her şey',
      p: `Hermes, ${HERMES_FEATURE_METRICS.alan} ana çalışma alanındaki ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özelliği tek atölyede birleştirir; gelecek platformlar ve yol haritası bu sayıya dahil değildir.`,
      featured: [
        {
          glyph: '☉',
          title: 'Gezegen kartları',
          desc: 'Haritadaki bir gezegene dokun; asalet, ev, hız, mizaç, anahtar temalar ve açı tanıkları aynı katmanlı kartta açılsın.',
          src: '/assets/ekranlar/modul-gezegen-kartlari.png',
          alt: 'Hermes Güneş gezegen kartı ve doğum haritası çalışma alanı'
        },
        {
          glyph: '☿︎',
          title: 'Kütüphane & AA Harita Arşivi',
          desc: 'Kendi notların, kaynakların ve doğrulanmış harita kayıtların aranabilir bir araştırma kütüphanesinde bir arada.',
          src: '/assets/ekranlar/modul-kutuphane.png',
          alt: 'Hermes astroloji kütüphanesi konu ağacı ve okuma alanı'
        }
      ],
      cards: HERMES_HOME_FEATURE_CARDS
    },
    akis: {
      title: 'Üç adımda çalışmaya başla',
      items: [
        { title: 'İndir & kur', desc: 'Windows kurulumu birkaç dakika sürer; efemeris dosyaları programla birlikte gelir.' },
        { title: 'Haritanı kur', desc: 'Tarih, saat, yer — Hermes haritayı saniyeler içinde çizer, dilediğin tekniğe geçersin.' },
        { title: 'Atölyeni büyüt', desc: 'Danışanlarını, notlarını ve araştırmalarını tek yerde biriktir; her şey cihazında kalır.' }
      ]
    },
    ekranlar: {
      kicker: 'GERÇEK ÜRÜN EKRANLARI',
      title: 'Hermes gerçekten böyle çalışıyor',
      p: 'Kadrandan astrografiye, aşağıdaki görüntülerin tamamı çalışan Hermes uygulamasından alındı.',
      shots: [
        { src: '/assets/ekranlar/ana-1.png', cap: 'Yeni nesil 90° Uranyen kadran', alt: 'Hermes yeni nesil 90 derece Uranyen kadran ekranı', heroZoom: true },
        { src: '/assets/ekranlar/modul-gezegen-kartlari.png', cap: 'Katmanlı gezegen kartları', alt: 'Hermes Güneş gezegen kartı ve doğum haritası çalışma alanı' },
        { src: '/assets/ekranlar/modul-kutuphane.png', cap: 'Kütüphane & AA Harita Arşivi', alt: 'Hermes astroloji kütüphanesi konu ağacı ve okuma alanı' },
        { src: '/assets/ekranlar/ana-2.png', cap: 'İleri teknikler · Harmonik harita', alt: 'Hermes ileri teknikler harmonik harita ekranı' },
        { src: '/assets/ekranlar/ana-3.png', cap: 'Üç halkalı karşılaştırmalı harita', alt: 'Hermes üç halkalı karşılaştırmalı harita ekranı' },
        { src: '/assets/ekranlar/ana-4.png', cap: 'Astrokartografi çalışma alanı', alt: 'Hermes astrokartografi dünya haritası ve konum inceleme ekranı' },
        { src: '/assets/ekranlar/ana-5.png', cap: 'Local Space çalışma alanı', alt: 'Hermes Local Space harita ve yön inceleme ekranı' }
      ]
    },
    gizlilik: {
      kicker: 'GİZLİLİK',
      title: 'Verilerin senin cihazında',
      p: 'Danışan verileri buluta gitmez; harita hesapları tamamen çevrimdışı yapılır. İnternet yalnız iki şey için gerekir: lisans doğrulama ve güncellemeler.',
      rows: ['Danışan verisi cihazda — bulut zorunluluğu yok', 'Hesap motoru çevrimdışı çalışır', 'Otomatik güncelleme; sürümler imzalı dağıtılır']
    },
    fiyatBand: {
      kicker: 'TEK SEFERLİK CİHAZ LİSANSI',
      title: '1 cihaz EFT/Havale ₺6.000.',
      p: 'Her lisans yalnız bir cihazda geçerlidir. İkinci cihaz için ayrı lisans +₺2.500; iki cihaz toplam ₺8.500’dür. Aynı cihaz için yayımlanan güncellemeler dahildir. Cihazlar arası veri senkronizasyonu ileride ayrı abonelik hizmeti olarak sunulacaktır.',
      btn: 'Fiyat ayrıntıları'
    }
  },

  ozellikler: {
    envanterSurumu: HERMES_FEATURE_INVENTORY_VERSION,
    hero: {
      kicker: 'DOĞRULANMIŞ ÜRÜN ENVANTERİ',
      title: 'Hermes’in çalışma alanları',
      p: `${HERMES_FEATURE_METRICS.alan} ana alandaki ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özellik aşağıda tek tek listelenir. Gelecek macOS/mobil sürümleri, senkronizasyon planı ve kişisel geliştirme araçları bu sayıya dahil değildir.`
    },
    gruplar: HERMES_FEATURE_GROUPS
  },

  fiyat: {
    hero: {
      kicker: 'FİYAT',
      title: 'Her cihaz için ayrı lisans.',
      p: 'Hermes program lisansı tek seferliktir ve yalnız etkinleştirildiği bir cihazda geçerlidir. Farklı bir cihazda kullanmak için o cihaz adına ayrı lisans gerekir.'
    },
    kutu: {
      kicker: 'EFT / HAVALE FİYATI',
      price: '₺6.000', oldPrice: '',
      secondLicensePrice: '₺2.500',
      secondPrice: '₺8.500',
      vatNote: 'Fiyatlara KDV dahildir.',
      rows: [
        '☿︎ Tüm modüller — sınırsız harita ve danışan',
        '☿︎ Windows 10/11 (64-bit) — şimdi',
        '☿︎ Her lisans yalnız bir cihazda geçerlidir',
        '☿︎ Farklı cihaz için ayrı lisans gerekir',
        '☿︎ Aynı cihaz için yayımlanan güncellemeler dahil'
      ],
      alt: 'Satın alma sayfasında lisansını seç ve iletişim bilgilerini ilet; ödeme ve lisans teslim adımlarını birlikte netleştirelim.',
      btn: 'Satın al'
    },
    tekLisans: {
      title: 'Platform ve cihaz planı',
      p: 'Windows ve Mac bilgisayarlar ile Android telefon veya tablet, iPhone ve iPad ayrı cihaz sayılır. Yeni bir cihazda Hermes kullanmak için o cihaz adına ayrı lisans alınır.',
      rows: [
        'Windows 10/11 (64-bit) — şimdi',
        'macOS — 17 Ağustos 2026',
        'Android · iPhone · iPad — daha sonra',
        'Cihazlar arası veri senkronizasyonu — ileride ayrı abonelik hizmeti'
      ]
    },
    sss: [
      { q: 'Program lisansı abonelik mi?', a: 'Hayır. Program lisansı tek seferlik satın alınır ve etkinleştirildiği bir cihazda geçerlidir.' },
      { q: 'Her lisans kaç cihazda geçerli?', a: 'Bir cihazda. Farklı veya ikinci bir cihazda kullanmak için o cihaz adına ayrı lisans gerekir.' },
      { q: 'Kart fiyatı nasıl belirleniyor?', a: 'Tek çekim kart fiyatı, EFT/Havale hedef tutarı ve PayTR’nin güncel mağaza oranıyla otomatik hesaplanır. Taksitli toplam PayTR ekranında karta ve vadeye göre değişebilir.' },
      { q: 'Güncellemeler ücretli mi?', a: 'Aynı cihaz için yayımlanan program güncellemeleri lisansa dahildir.' },
      { q: 'Cihazlar arası senkronizasyon lisansa dahil mi?', a: 'Hayır. Veri senkronizasyonu ileride isteğe bağlı ve ayrı bir abonelik hizmeti olarak sunulacaktır.' },
      { q: 'İade var mı?', a: 'Mesafeli satış koşulları geçerlidir; ayrıntı için İptal & İade sayfasına bak.' }
    ]
  },

  indir: {
    hero: {
      kicker: 'İNDİR',
      title: 'Hermes’i kur',
      p: 'Hermes şu an Windows 10/11 (64-bit) için dağıtılıyor. Ödeme onayından sonra kurulum bağlantın e-postana gelir; lisans isteğini programın içinden gönderirsin.'
    },
    gorsel: { src: '/assets/ekranlar/indir-onizleme.png', cap: 'Hermes açılış ekranı' },
    surum: {
      baslik: 'Güncel sürüm',
      ver: '1.4.x',
      not: 'Hermes kendini otomatik günceller: yeni sürüm yayınlandığında program açılışta indirir ve kurar. Sürüm geçmişi program içindeki değişiklik notlarında.'
    },
    adimlar: {
      title: 'Kurulum',
      items: [
        { title: 'Satın alma talebini ilet', desc: 'Fiyat sayfasındaki Satın Al düğmesinden lisansını seç ve iletişim bilgilerini güvenle ilet.' },
        { title: 'Kurulumu indir', desc: 'Ödeme onayından sonra e-postana gelen Hermes indirme sayfasını aç ve Windows kurulumunu bilgisayarına kaydet.' },
        { title: 'Lisansını iste ve etkinleştir', desc: 'Programda Lisans İste bölümüne ad, soyad ve e-postanı yaz. İmzalı lisans anahtarın geldiğinde aynı ekrandan etkinleştir.' }
      ]
    },
    sistem: {
      title: 'Sistem gereksinimleri',
      win: ['Windows 10 / 11 (64-bit)', '8 GB RAM önerilir', '~1 GB boş disk alanı (efemeris dahil)', 'Lisans doğrulama ve güncelleme için internet'],
      not: 'macOS sürümü 17 Ağustos 2026’da sunulacaktır. Android, iPhone ve iPad sürümleri daha sonra gelecektir. Her cihaz ayrı lisans gerektirir; cihazlar arası veri senkronizasyonu ileride ayrı abonelik hizmeti olarak sunulacaktır.'
    }
  },

  sss: {
    hero: { kicker: 'SSS', title: 'Sık sorulanlar', p: 'Cevabını bulamazsan iletişim formundan yaz; en geç iki iş günü içinde dönüş yapılır.' },
    items: [
      { q: 'Hermes nedir?', a: 'Hermes, profesyonel kullanım için geliştirilmiş Türkçe masaüstü astroloji programıdır: doğum haritası, transit, ilerletme, dönem teknikleri, tutulmalar, sinastri, horary, elektif tarama, rektifikasyon, astrokartografi, Uranyen dial ve danışan yönetimi tek uygulamada.' },
      { q: 'Kimler için?', a: 'Danışmanlık veren astrologlar, ciddi öğrenciler ve araştırmacılar için tasarlandı. Günlük burç yorumu uygulaması değildir.' },
      { q: 'Hesaplar ne kadar hassas?', a: 'Hesap motoru Swiss Ephemeris kullanır; gezegen konumları, evler, asteroidler ve sabit yıldızlar efemeris kaynağıyla birebir hesaplanır. Efemeris dosyaları programla birlikte gelir, hesap için internet gerekmez.' },
      { q: 'Lisans nasıl çalışıyor?', a: 'Program lisansı tek seferlik satın alınır ve yalnız etkinleştirildiği bir cihazda geçerlidir. Farklı veya ikinci cihaz için ayrı lisans gerekir. 1 cihaz EFT/Havale fiyatı ₺6.000; ikinci cihaz lisansı +₺2.500, iki cihaz toplam ₺8.500’dür. Aynı cihaz için yayımlanan güncellemeler dahildir.' },
      { q: 'Android, iPhone ve iPad sürümleri olacak mı?', a: 'Evet. Android, iPhone ve iPad sürümleri yol haritasındadır ve daha sonra yayımlanacaktır. Her cihaz için ayrı lisans gerekir.' },
      { q: 'Verilerim nerede tutuluyor?', a: 'Varsayılan olarak cihazında. Danışan kayıtların ve haritaların bilgisayarından çıkmaz; bulut zorunluluğu yoktur. İnternet yalnız lisans doğrulama ve güncelleme için kullanılır.' },
      { q: 'Hangi platformlarda çalışıyor?', a: 'Hermes şu an Windows 10/11 (64-bit) bilgisayarlarda kullanılabilir. macOS sürümü 17 Ağustos 2026’da sunulacaktır. Android, iPhone ve iPad sürümleri daha sonra gelecektir.' },
      { q: 'Cihazlar arasında veri senkronizasyonu olacak mı?', a: 'Evet, ileride isteğe bağlı bir hizmet olarak sunulması planlanıyor. Senkronizasyon program lisansına dahil değildir ve ayrı abonelik gerektirecektir.' },
      { q: 'Güncellemeler nasıl geliyor?', a: 'Program kendini otomatik günceller: yeni sürüm yayınlandığında açılışta indirir ve kurar; ücretsizdir.' },
      { q: 'Satın almadan deneyebilir miyim?', a: 'Şu an deneme sürümü yok; gerçek program ekranlarını Ana Sayfa ve Özellikler sayfasından inceleyebilirsin. Sorularını iletişim formundan sorabilirsin.' },
      { q: 'Astroloji eğitimi veriyorum; işime yarar mı?', a: 'Evet — Öğretmen modülü sınıf ve ödeme takibi tutar; kütüphane ve AA harita arşivi ders materyali çalışmaya uygundur.' },
      { q: 'İade koşulları ne?', a: 'Mesafeli satış sözleşmesi ve iade koşulları Yasal sayfalarında yazar; dijital teslim edilen lisanslarda yasal çerçeve geçerlidir.' }
    ]
  }
};
