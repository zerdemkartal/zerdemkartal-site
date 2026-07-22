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
      description: 'Hermes: doğum haritası, transit, sinastri, horary, rektifikasyon, astrokartografi ve AI analiz asistanı tek programda. Verilerin cihazında kalır. Tek seferlik lisans, her platform.'
    },
    ozellikler: {
      title: 'Özellikler — Hermes Astroloji Programı',
      description: 'Hermes’in tüm modülleri: Swiss Ephemeris hassasiyetinde harita motoru, zamanlama teknikleri, sinastri, horary, elektif tarama, rektifikasyon, astrokartografi, Uranyen dial ve AI analiz.'
    },
    fiyat: {
      title: 'Fiyat — Hermes | Tek seferlik lisans, her platform',
      description: 'Hermes ön satış: ₺3.000 tek seferlik lisans (liste ₺9.999). Abonelik yok, ömür boyu güncelleme. Lisansın masaüstünde ve yol haritasındaki web/Android sürümlerinde geçerli.'
    },
    indir: {
      title: 'İndir — Hermes Astroloji Programı (Windows)',
      description: 'Hermes’i Windows 10/11 bilgisayarına kur. Sistem gereksinimleri, kurulum adımları ve güncel sürüm bilgisi.'
    },
    sss: {
      title: 'Sık Sorulan Sorular — Hermes Astroloji Programı',
      description: 'Hermes hakkında merak edilenler: lisans, ödeme, güncellemeler, çevrimdışı çalışma, veri gizliliği, web sürümü ve AI analiz asistanı.'
    }
  },

  home: {
    hero: {
      kicker: 'HERMES ASTROLOJİ PROGRAMI',
      title: 'Gökyüzü, masaüstünde.',
      p: 'Hermes; doğum haritasından horary’ye, rektifikasyondan astrokartografiye profesyonel bir astroloji atölyesini tek sakin ekranda toplar. Hesaplar Swiss Ephemeris hassasiyetinde, yorum dili Türkçe, verilerin ise yalnız senin cihazında.',
      btn1: 'Özellikleri gör', btn1Href: '/ozellikler',
      btn2: 'Ön satış — ₺3.000', btn2Href: '/fiyat',
      stats: ['Windows 10/11', 'Tek seferlik lisans', 'Çevrimdışı çalışır']
    },
    moduller: {
      kicker: 'NELER VAR',
      title: 'Bir astroloğun masasındaki her şey',
      p: 'Hermes bir “burç uygulaması” değil; danışan defterinden araştırma arşivine, ciddi astroloji pratiğinin tamamı için tasarlandı.',
      cards: [
        { glyph: '☉', title: 'Doğum haritası & Zodyak', desc: 'Swiss Ephemeris motoru; gezegenler, evler, açılar, asteroidler ve sabit yıldızlar — derece derece.' },
        { glyph: '☾', title: 'Zamanlama teknikleri', desc: 'Transitler, ilerletmeler, dönem teknikleri ve tutulmalar; öngörü çalışması tek akışta.' },
        { glyph: '∞', title: 'Sinastri', desc: 'İki haritanın karşılaştırması — ilişkinin gökyüzünü iki taraftan okur.' },
        { glyph: '☿︎', title: 'Horary (Soru Astrolojisi)', desc: 'Soru haritası kurulumu ve klasik horary değerlendirmesi için ayrılmış modül.' },
        { glyph: '⌖', title: 'Rektifikasyon & Elektif', desc: 'Yaşam olaylarından doğum saati düzeltme; uygun an için tarih aralığı taraması.' },
        { glyph: '◎', title: 'Astrokartografi & Uranyen', desc: 'Dünya haritası üzerinde yer analizi; 90° dial ve orta noktalarla Uranyen çalışması.' },
        { glyph: '✦', title: 'AI analiz asistanı', desc: 'Natal’dan karmik’e 11 analiz tipinde, korku dili kurmayan üslupla yazılmış Türkçe analiz taslakları.' },
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
    ai: {
      kicker: '✦ AI ANALİZ',
      title: 'Yapay zekâ, astroloğun kalemiyle',
      p: 'Hermes’in analiz asistanı hazır kalıp basmaz: çoklu tanıklık ister, önce yapıya sonra ayrıntıya bakar ve kaderci dil kurmadan yazar. Natal, tahmin, horary, elektif, sinastri, medikal, finansal, mesleki, karmik, psikolojik ve lokasyonel — 11 analiz tipinin her birinin kendi metodolojisi vardır.',
      rows: ['11 analiz tipi, tip başına ayrı metodoloji', 'Türkçe, insan gibi yazan üslup rehberi', 'Analizler danışan dosyasına kaydedilir']
    },
    gizlilik: {
      kicker: 'GİZLİLİK',
      title: 'Verilerin senin cihazında',
      p: 'Danışan verileri buluta gitmez; harita hesapları tamamen çevrimdışı yapılır. İnternet yalnız üç şey için gerekir: lisans doğrulama, güncellemeler ve (istersen) AI analiz.',
      rows: ['Danışan verisi cihazda — bulut zorunluluğu yok', 'Hesap motoru çevrimdışı çalışır', 'Otomatik güncelleme; sürümler imzalı dağıtılır']
    },
    fiyatBand: {
      kicker: 'ÖN SATIŞ',
      title: 'Erken alana ₺3.000, yayında ₺9.999.',
      p: 'Tek seferlik lisans; abonelik yok. Çıkan tüm güncellemeler ve yol haritasındaki web/Android erişimi lisansına dahil.',
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
        items: [
          { ad: 'Doğum haritası', desc: 'Gezegenler, evler, açılar; ev sistemleri ve ayanamsa seçenekleriyle. Derece hassasiyeti efemeris kaynağıyla birebir.' },
          { ad: 'Zodyak çalışma alanı', desc: 'Burçlar, yöneticilikler ve asaletler üzerinde yoğun veri ekranı; öğrenme ve başvuru için.' },
          { ad: 'Asteroidler & sabit yıldızlar', desc: 'Efemeris dosyaları programla gelir; internetsiz de tam hesap.' }
        ]
      },
      {
        id: 'zamanlama', baslik: 'Zamanlama & öngörü',
        giris: 'Tahmin çalışması tek modüle sıkışmaz; teknikler yan yana kurulur ve aynı danışan üzerinde birleşir.',
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
        items: [
          { ad: 'Sinastri', desc: 'İki haritanın karşılıklı açıları ve ev temasları; ilişki dinamiğini iki taraftan okur.' },
          { ad: 'Horary (Soru Astrolojisi)', desc: 'Soru anına harita kurar; klasik horary değerlendirme düzeniyle çalışır.' }
        ]
      },
      {
        id: 'ileri', baslik: 'İleri teknikler',
        giris: 'Çoğu programda eklenti olan araçlar Hermes’te yerleşiktir.',
        items: [
          { ad: 'Rektifikasyon', desc: 'Yaşam olaylarından geriye doğru doğum saati düzeltme; aday saatleri puanlayarak daraltır.' },
          { ad: 'Elektif (seçim taraması)', desc: 'Bir işe başlamak için tarih aralığını tarar, kriterlerine uyan anları listeler.' },
          { ad: 'Astrokartografi', desc: 'Gezegen hatlarını dünya haritası üzerine çizer; yer değiştirme sorularına görsel cevap.' },
          { ad: 'Uranyen astroloji', desc: '90° dial, orta noktalar ve yakınlaştırmalı kadran; Uranyen ekolüyle çalışanlar için.' }
        ]
      },
      {
        id: 'ai', baslik: 'AI analiz asistanı ✦',
        giris: 'Analiz asistanı, astroloji bilgisine üslup terbiyesi eklenmiş bir yazım ortağıdır: kaderci dil, korku dili ve klişe yasak.',
        items: [
          { ad: '11 analiz tipi', desc: 'Natal, tahmin, horary, elektif, sinastri, medikal, finansal, mesleki, karmik, psikolojik, lokasyonel — her tipin kendi metodoloji dosyası vardır.' },
          { ad: 'Analiz sohbeti', desc: 'Harita verisinin üzerinde soru-cevap; analiz tek adımda da alınabilir.' },
          { ad: 'Kayıt & arşiv', desc: 'Üretilen analizler danışan dosyasına işlenir; sonra dönüp bakarsın.' }
        ]
      },
      {
        id: 'atolye', baslik: 'Danışan atölyesi',
        giris: 'Hermes yalnız hesap yapmaz; bir danışmanlık pratiğinin defterini de tutar.',
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
        items: [
          { ad: 'Çevrimdışı çekirdek', desc: 'Efemeris gömülü; internet yalnız lisans, güncelleme ve AI için.' },
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
      title: 'Tek lisans, her platform.',
      p: 'Hermes abonelik satmaz. Bir kez alırsın; program, güncellemeleri ve yol haritasındaki platformlar (web, Android) o lisansla senin olur.'
    },
    kutu: {
      kicker: 'ÖN SATIŞA ÖZEL',
      price: '₺3.000', oldPrice: '₺9.999',
      rows: [
        '☿︎ Tüm modüller — sınırsız harita ve danışan',
        '☿︎ Windows 10/11 (64-bit) kurulumu',
        '☿︎ Aynı kişiye ait 2 cihaza kadar',
        '☿︎ Çıkan tüm sürümler ve güncellemeler dahil',
        '☿︎ Web sürümü yayınlandığında üye girişinle erişim'
      ],
      alt: 'Ön sipariş sonrası ödeme bağlantısı e-postana gönderilir; lisans anahtarın ödemeyle birlikte teslim edilir.',
      btn: 'Ön sipariş ver'
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
      { q: 'Ön satış ne demek?', a: 'Program aktif geliştirmede; erken alanlar ₺3.000 özel fiyattan edinir. Yayın fiyatı ₺9.999 olarak planlanmıştır.' },
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
    surum: {
      baslik: 'Güncel sürüm',
      ver: '1.4.x',
      not: 'Hermes kendini otomatik günceller: yeni sürüm yayınlandığında program açılışta indirir ve kurar. Sürüm geçmişi program içindeki değişiklik notlarında.'
    },
    adimlar: {
      title: 'Kurulum',
      items: [
        { title: 'Ön siparişini ver', desc: 'Fiyat sayfasından ön sipariş oluştur; ödeme bağlantısı e-postana gelir.' },
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
      { q: 'Hermes nedir?', a: 'Hermes, profesyonel kullanım için geliştirilmiş Türkçe masaüstü astroloji programıdır: doğum haritası, transit, ilerletme, dönem teknikleri, tutulmalar, sinastri, horary, elektif tarama, rektifikasyon, astrokartografi, Uranyen dial, AI analiz asistanı ve danışan yönetimi tek uygulamada.' },
      { q: 'Kimler için?', a: 'Danışmanlık veren astrologlar, ciddi öğrenciler ve araştırmacılar için tasarlandı. Günlük burç yorumu uygulaması değildir.' },
      { q: 'Hesaplar ne kadar hassas?', a: 'Hesap motoru Swiss Ephemeris kullanır; gezegen konumları, evler, asteroidler ve sabit yıldızlar efemeris kaynağıyla birebir hesaplanır. Efemeris dosyaları programla birlikte gelir, hesap için internet gerekmez.' },
      { q: 'Lisans nasıl çalışıyor?', a: 'Tek seferlik satın alma; abonelik yok. Bir lisans aynı kişiye ait 2 cihaza kadar kullanılabilir, çıkan tüm güncellemeler dahildir.' },
      { q: 'Web sürümü olacak mı?', a: 'Evet, yol haritasında. Web sürümü tam sürüm olacak ve yalnız satın alanlar üye girişi + lisans doğrulamasıyla kullanabilecek. Ek ücret yok — aynı lisans.' },
      { q: 'Verilerim nerede tutuluyor?', a: 'Cihazında. Danışan kayıtların ve haritaların bilgisayarından çıkmaz; bulut zorunluluğu yoktur. İnternet yalnız lisans doğrulama, güncelleme ve istersen AI analiz için kullanılır.' },
      { q: 'AI analiz nasıl çalışıyor?', a: 'Analiz asistanı 11 analiz tipinde (natal, tahmin, horary, elektif, sinastri, medikal, finansal, mesleki, karmik, psikolojik, lokasyonel) ayrı metodolojilerle çalışır ve kaderci dil kurmayan bir üslup rehberine bağlıdır. AI kullanmak isteğe bağlıdır; internet gerektirir.' },
      { q: 'Hangi platformlarda çalışıyor?', a: 'Bugün Windows 10/11 (64-bit). macOS, Android ve web sürümleri yol haritasındadır; tek lisans hepsinde geçerli olacak.' },
      { q: 'Güncellemeler nasıl geliyor?', a: 'Program kendini otomatik günceller: yeni sürüm yayınlandığında açılışta indirir ve kurar; ücretsizdir.' },
      { q: 'Satın almadan deneyebilir miyim?', a: 'Şu an deneme sürümü yok; özellikleri Özellikler sayfasından ve blogdaki ekran görüntülü yazılardan inceleyebilirsin. Sorularını iletişim formundan sorabilirsin.' },
      { q: 'Astroloji eğitimi veriyorum; işime yarar mı?', a: 'Evet — Öğretmen modülü sınıf ve ödeme takibi tutar; kütüphane ve AA harita arşivi ders materyali çalışmaya uygundur.' },
      { q: 'İade koşulları ne?', a: 'Mesafeli satış sözleşmesi ve iade koşulları Yasal sayfalarında yazar; dijital teslim edilen lisanslarda yasal çerçeve geçerlidir.' }
    ]
  }
};
