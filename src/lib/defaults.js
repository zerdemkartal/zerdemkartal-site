// HERMES sitesi içerik varsayılanları — TEK anahtar: PageContent 'hermes_site'.
// Tüm sayfa metinleri buradan gelir; DB'de satır varsa bölüm bazında üstüne biner
// (sayfalarda shallow-merge). Claude MCP (icerik/sayfa_metni araçları, dot-path)
// ile TAMAMI yönetilebilir — kullanıcı kararı 2026-07-19: "her şeyi Claude MCP ile yönetecek".
// İçerik kaynağı: Hermes'in GERÇEK modülleri (C:\Hermes MIMARI.md / hermes.html nav).
// Kural: uydurma kullanıcı yorumu ve puan YOK (eski PD_HERMES'teki taklit yorumlar bilinçli atıldı).
// Not: metin içi kesmeler tipografik ’ — düz ' tek tırnaklı string'i kırar.

export const HERMES_SITE = {
  seo: {
    home: {
      title: 'Hermes — Profesyonel Masaüstü Astroloji Programı',
      description: 'Hermes: doğum haritası, transit, sinastri, horary, rektifikasyon ve astrokartografi tek programda. Verilerin cihazında kalır. Tek seferlik lisans, her platform.'
    },
    ozellikler: {
      title: 'Özellikler — Hermes Astroloji Programı',
      description: 'Hermes’in tüm modülleri: Swiss Ephemeris hassasiyetinde harita motoru, zamanlama teknikleri, sinastri, horary, elektif tarama, rektifikasyon, astrokartografi ve Uranyen dial.'
    },
    fiyat: {
      title: 'Fiyat — Hermes | Tek seferlik lisans, abonelik yok',
      description: 'Hermes ön satış fiyatı ₺6.000; program fiyatı ₺8.500. İkinci cihaz lisansı +₺2.500, iki cihaz toplam ₺8.500. Fiyatlara KDV dahildir; abonelik yoktur.'
    },
    indir: {
      title: 'İndir — Hermes Astroloji Programı (Windows)',
      description: 'Hermes’i Windows 10/11 bilgisayarına kur. Sistem gereksinimleri, kurulum adımları ve güncel sürüm bilgisi.'
    },
    sss: {
      title: 'Sık Sorulan Sorular — Hermes Astroloji Programı',
      description: 'Hermes hakkında merak edilenler: lisans, ödeme, güncellemeler, çevrimdışı çalışma, veri gizliliği ve web sürümü.'
    }
  },

  home: {
    hero: {
      kicker: 'HERMES ASTROLOJİ PROGRAMI',
      title: 'Gökyüzü, masaüstünde.',
      p: 'Hermes; doğum haritasından horary’ye, rektifikasyondan astrokartografiye profesyonel bir astroloji atölyesini tek sakin ekranda toplar. Hesaplar Swiss Ephemeris hassasiyetinde, yorum dili Türkçe, verilerin ise yalnız senin cihazında.',
      btn1: 'Programı keşfet', btn1Href: '/ozellikler',
      btn2: 'Ön satışa katıl — ₺6.000', btn2Href: '/fiyat',
      stats: ['Windows 10/11', 'Tek seferlik lisans', 'Çevrimdışı çalışır'],
      doner: [
        'Kendi astroloji kütüphaneniz programın içinde, her an el altında olsun ister misiniz?',
        'Doğum haritasından horary’ye, tüm teknikler tek sakin ekranda buluşsun ister misiniz?',
        'Danışan verileriniz buluta değil, yalnız sizin cihazınızda kalsın ister misiniz?'
      ]
    },
    moduller: {
      kicker: 'NELER VAR',
      title: 'Bir astroloğun masasındaki her şey',
      p: 'Hermes bir “burç uygulaması” değil; danışan defterinden araştırma arşivine, ciddi astroloji pratiğinin tamamı için tasarlandı.',
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
      cards: [
        { glyph: '☉', title: 'Doğum haritası & Zodyak', desc: 'Swiss Ephemeris motoru; gezegenler, evler, açılar, asteroidler ve sabit yıldızlar — derece derece.' },
        { glyph: '☾', title: 'Zamanlama teknikleri', desc: 'Transitler, ilerletmeler, dönem teknikleri ve tutulmalar; öngörü çalışması tek akışta.' },
        { glyph: '∞', title: 'Sinastri', desc: 'İki haritanın karşılaştırması — ilişkinin gökyüzünü iki taraftan okur.' },
        { glyph: '☿︎', title: 'Horary (Soru Astrolojisi)', desc: 'Soru haritası kurulumu ve klasik horary değerlendirmesi için ayrılmış modül.' },
        { glyph: '⌖', title: 'Rektifikasyon & Elektif', desc: 'Yaşam olaylarından doğum saati düzeltme; uygun an için tarih aralığı taraması.' },
        { glyph: '◎', title: 'Astrokartografi & Uranyen', desc: 'Dünya haritası üzerinde yer analizi; 90° dial ve orta noktalarla Uranyen çalışması.' },
        { glyph: '❧', title: 'Danışan atölyesi', desc: 'Danışan kayıtları, notlar, olay günlüğü, raporlar, kütüphane ve AA harita arşivi.' }
      ]
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
      kicker: 'ÖN SATIŞ',
      title: 'Ön satış ₺6.000, program fiyatı ₺8.500.',
      p: 'Ön satış lisansı 1 cihaz için ₺6.000’dir. İkinci cihaz lisansı +₺2.500; iki cihaz toplam ₺8.500’dür. Fiyatlara KDV dahildir. Abonelik yok; güncellemeler ve yol haritasındaki web/Android erişimi dahildir.',
      btn: 'Fiyat ayrıntıları'
    }
  },

  ozellikler: {
    hero: {
      kicker: 'ÖZELLİKLER',
      title: 'Modül modül Hermes',
      p: 'Aşağıdaki her başlık programda ayrı bir çalışma alanıdır. Hepsi aynı harita motorunu paylaşır; bir danışan seçtiğinde tüm modüller ona göre kurulur.'
    },
    gruplar: [
      {
        id: 'motor', baslik: 'Harita motoru',
        giris: 'Hermes’in kalbi, Swiss Ephemeris tabanlı hesap motorudur; tüm modüller aynı hassas çekirdeği kullanır.',
        gorsel: { src: '/assets/ekranlar/modul-motor.png', cap: 'Yeni nesil 90° harita motoru' },
        items: [
          { ad: 'Doğum haritası', desc: 'Gezegenler, evler, açılar; ev sistemleri ve ayanamsa seçenekleriyle. Derece hassasiyeti efemeris kaynağıyla birebir.' },
          { ad: 'Zodyak çalışma alanı', desc: 'Burçlar, yöneticilikler ve asaletler üzerinde yoğun veri ekranı; öğrenme ve başvuru için.' },
          { ad: 'Asteroidler & sabit yıldızlar', desc: 'Efemeris dosyaları programla gelir; internetsiz de tam hesap.' }
        ]
      },
      {
        id: 'zamanlama', baslik: 'Zamanlama & öngörü',
        giris: 'Tahmin çalışması tek modüle sıkışmaz; teknikler yan yana kurulur ve aynı danışan üzerinde birleşir.',
        gorsel: { src: '/assets/ekranlar/modul-zamanlama.png', cap: 'Transit katmanı ve gezegen bilgi kartı' },
        items: [
          { ad: 'Transitler', desc: 'Gökyüzü trafiğini natal haritanın üzerine bindirir; dönem dönem izlersin.' },
          { ad: 'İlerletmeler', desc: 'Sekonder ilerletme ve yön teknikleriyle iç zamanlama.' },
          { ad: 'Dönem teknikleri', desc: 'Zaman lordu yaklaşımlarıyla hayatı bölümler hâlinde okuma.' },
          { ad: 'Tutulmalar', desc: 'Tutulma serilerini tarih aralığında tarar, haritaya temas noktalarını gösterir.' }
        ]
      },
      {
        id: 'iliski-soru', baslik: 'İlişki & soru',
        giris: 'İki ayrı disiplin, iki ayrı modül: haritalar arası ilişki ve anın sorusu.',
        gorsel: { src: '/assets/ekranlar/modul-iliski-soru.png', cap: 'Üç halkalı karşılaştırma kadranı' },
        items: [
          { ad: 'Sinastri', desc: 'İki haritanın karşılıklı açıları ve ev temasları; ilişki dinamiğini iki taraftan okur.' },
          { ad: 'Horary (Soru Astrolojisi)', desc: 'Soru anına harita kurar; klasik horary değerlendirme düzeniyle çalışır.' }
        ]
      },
      {
        id: 'ileri', baslik: 'İleri teknikler',
        giris: 'Çoğu programda eklenti olan araçlar Hermes’te yerleşiktir.',
        gorsel: { src: '/assets/ekranlar/modul-ileri.png', cap: 'Dynamic Charts · Harmonik çalışma alanı' },
        items: [
          { ad: 'Rektifikasyon', desc: 'Yaşam olaylarından geriye doğru doğum saati düzeltme; aday saatleri puanlayarak daraltır.' },
          { ad: 'Elektif (seçim taraması)', desc: 'Bir işe başlamak için tarih aralığını tarar, kriterlerine uyan anları listeler.' },
          { ad: 'Astrokartografi', desc: 'Gezegen hatlarını dünya haritası üzerine çizer; yer değiştirme sorularına görsel cevap.' },
          { ad: 'Uranyen astroloji', desc: '90° dial, orta noktalar ve yakınlaştırmalı kadran; Uranyen ekolüyle çalışanlar için.' }
        ]
      },      {
        id: 'atolye', baslik: 'Danışan atölyesi',
        giris: 'Hermes yalnız hesap yapmaz; bir danışmanlık pratiğinin defterini de tutar.',
        gorsel: { src: '/assets/ekranlar/modul-atolye.png', cap: 'Analiz detay merkezi' },
        items: [
          { ad: 'Danışan yönetimi', desc: 'Kayıtlar, kategoriler, toplu işlemler; danışan başına harita, not, olay ve analiz geçmişi.' },
          { ad: 'Raporlar', desc: 'Çalışmalarını derli toplu rapor hâline getirir.' },
          { ad: 'Kütüphane & AA Harita Arşivi', desc: 'Astroloji kütüphanesi ve AstroDatabank tarzı doğrulanmış doğum verisi arşiviyle araştırma.' },
          { ad: 'Araştırma & istatistikler', desc: 'Haritalar üzerinde desen arama ve istatistik toplama araçları.' },
          { ad: 'Öğretmen modülü', desc: 'Astroloji eğitimi verenler için sınıf ve ödeme takibi.' }
        ]
      },
      {
        id: 'platform', baslik: 'Platform & gizlilik',
        giris: 'Program bugün Windows’ta; lisansın ise platforma değil sana bağlı.',
        gorsel: { src: '/assets/ekranlar/modul-platform.png', cap: 'Koyu temada astrokartografi çalışma alanı' },
        items: [
          { ad: 'Çevrimdışı çekirdek', desc: 'Efemeris gömülü; internet yalnız lisans ve güncelleme için.' },
          { ad: 'Veri cihazda', desc: 'Danışan verilerin bilgisayarından çıkmaz; bulut zorunluluğu yok.' },
          { ad: 'Görsel temalar', desc: 'Gündüz ve gece çalışmaya uygun tema aileleri — bu sitenin koyu modu da programdaki “Meridyen Rasathanesi” temasıdır.' },
          { ad: 'Yol haritası', desc: 'Web sürümü (satın alanlara, üye girişiyle) ve Android çalışması planda; tek lisans hepsinde geçerli olacak.' }
        ]
      }
    ]
  },

  fiyat: {
    hero: {
      kicker: 'FİYAT',
      title: 'Tek lisans. Abonelik yok.',
      p: 'Hermes’i bir kez alırsın; Windows uygulaması ve güncellemeleri bu lisansa dahildir. Web ve Android sürümleri yol haritasında aynı hesapla devam edecek.'
    },
    kutu: {
      kicker: 'ÖN SATIŞA ÖZEL',
      price: '₺6.000', oldPrice: '₺8.500',
      secondLicensePrice: '₺2.500',
      secondPrice: '₺8.500',
      vatNote: 'Fiyatlara KDV dahildir.',
      rows: [
        '☿︎ Tüm modüller — sınırsız harita ve danışan',
        '☿︎ Windows 10/11 (64-bit) kurulumu',
        '☿︎ Tek cihaz lisansı',
        '☿︎ Çıkan tüm sürümler ve güncellemeler dahil',
        '☿︎ Web sürümü yayınlandığında üye girişinle erişim'
      ],
      alt: 'Satın alma talebini WhatsApp’tan ilet; cihaz seçimini, ödeme ve lisans teslim adımlarını birlikte netleştirelim.',
      btn: 'WhatsApp’tan satın al'
    },
    tekLisans: {
      title: 'Lisans platforma değil, sana bağlı',
      p: 'Bugün Windows’ta çalışıyorsun; web sürümü çıktığında aynı hesapla tarayıcıdan girersin, Android geldiğinde tablette devam edersin. Yeniden ödeme yok.',
      rows: [
        'Masaüstü (Windows) — bugün',
        'Web uygulaması — yol haritasında; satın alanlara üye girişiyle, tam sürüm',
        'Android — yol haritasında'
      ]
    },
    sss: [
      { q: 'Abonelik mi, tek seferlik mi?', a: 'Tek seferlik. Hermes’i bir kez satın alırsın; abonelik ve gizli ücret yoktur.' },
      { q: 'Ön satış ne demek?', a: 'Program aktif geliştirmededir; ön satış fiyatı ₺6.000, program fiyatı ₺8.500’dür. İkinci cihaz lisansı +₺2.500’dür. Fiyatlara KDV dahildir.' },
      { q: 'Güncellemeler ücretli mi?', a: 'Hayır. Çıkan tüm sürümler ve güncellemeler lisansına dahildir.' },
      { q: 'İade var mı?', a: 'Mesafeli satış koşulları geçerlidir; ayrıntı için İptal & İade sayfasına bak.' }
    ]
  },

  indir: {
    hero: {
      kicker: 'İNDİR',
      title: 'Hermes’i kur',
      p: 'Hermes şu an Windows 10/11 (64-bit) için dağıtılıyor. Satın alım sonrası kurulum bağlantısı ve lisans anahtarın e-postana gönderilir; program açılışta lisansını doğrular.'
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
        { title: 'Satın alma talebini ilet', desc: 'Fiyat sayfasındaki düğmeyle WhatsApp’tan yaz; cihaz seçimini ve ödeme adımlarını netleştirelim.' },
        { title: 'Kurulum dosyasını indir', desc: 'Ödeme sonrası e-postandaki bağlantıdan Windows kurulum dosyasını al.' },
        { title: 'Lisansınla aç', desc: 'İlk açılışta lisans anahtarını gir; Hermes doğrular ve atölyen açılır.' }
      ]
    },
    sistem: {
      title: 'Sistem gereksinimleri',
      win: ['Windows 10 / 11 (64-bit)', '8 GB RAM önerilir', '~1 GB boş disk alanı (efemeris dahil)', 'Lisans doğrulama ve güncelleme için internet'],
      not: 'macOS ve Android sürümleri yol haritasındadır; lisansın onlarda da geçerli olacak.'
    }
  },

  sss: {
    hero: { kicker: 'SSS', title: 'Sık sorulanlar', p: 'Cevabını bulamazsan iletişim formundan yaz; en geç iki iş günü içinde dönüş yapılır.' },
    items: [
      { q: 'Hermes nedir?', a: 'Hermes, profesyonel kullanım için geliştirilmiş Türkçe masaüstü astroloji programıdır: doğum haritası, transit, ilerletme, dönem teknikleri, tutulmalar, sinastri, horary, elektif tarama, rektifikasyon, astrokartografi, Uranyen dial ve danışan yönetimi tek uygulamada.' },
      { q: 'Kimler için?', a: 'Danışmanlık veren astrologlar, ciddi öğrenciler ve araştırmacılar için tasarlandı. Günlük burç yorumu uygulaması değildir.' },
      { q: 'Hesaplar ne kadar hassas?', a: 'Hesap motoru Swiss Ephemeris kullanır; gezegen konumları, evler, asteroidler ve sabit yıldızlar efemeris kaynağıyla birebir hesaplanır. Efemeris dosyaları programla birlikte gelir, hesap için internet gerekmez.' },
      { q: 'Lisans nasıl çalışıyor?', a: 'Tek seferlik satın alma; abonelik yok. Ön satış lisansı 1 cihaz için ₺6.000’dir. İkinci cihaz lisansı +₺2.500; iki cihaz toplam ₺8.500’dür. Fiyatlara KDV ve çıkan tüm güncellemeler dahildir.' },
      { q: 'Web sürümü olacak mı?', a: 'Evet, yol haritasında. Web sürümü tam sürüm olacak ve yalnız satın alanlar üye girişi + lisans doğrulamasıyla kullanabilecek. Ek ücret yok — aynı lisans.' },
      { q: 'Verilerim nerede tutuluyor?', a: 'Cihazında. Danışan kayıtların ve haritaların bilgisayarından çıkmaz; bulut zorunluluğu yoktur. İnternet yalnız lisans doğrulama ve güncelleme için kullanılır.' },
      { q: 'Hangi platformlarda çalışıyor?', a: 'Bugün Windows 10/11 (64-bit). macOS, Android ve web sürümleri yol haritasındadır; tek lisans hepsinde geçerli olacak.' },
      { q: 'Güncellemeler nasıl geliyor?', a: 'Program kendini otomatik günceller: yeni sürüm yayınlandığında açılışta indirir ve kurar; ücretsizdir.' },
      { q: 'Satın almadan deneyebilir miyim?', a: 'Şu an deneme sürümü yok; gerçek program ekranlarını Ana Sayfa ve Özellikler sayfasından inceleyebilirsin. Sorularını iletişim formundan sorabilirsin.' },
      { q: 'Astroloji eğitimi veriyorum; işime yarar mı?', a: 'Evet — Öğretmen modülü sınıf ve ödeme takibi tutar; kütüphane ve AA harita arşivi ders materyali çalışmaya uygundur.' },
      { q: 'İade koşulları ne?', a: 'Mesafeli satış sözleşmesi ve iade koşulları Yasal sayfalarında yazar; dijital teslim edilen lisanslarda yasal çerçeve geçerlidir.' }
    ]
  }
};
