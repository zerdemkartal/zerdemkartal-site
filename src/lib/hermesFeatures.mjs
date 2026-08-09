// Hermes'in kamusal ürün envanteri.
// Yalnız müşteri uygulamasında çalışan ve MIMARI.md / canlı panel sözleşmesinde
// karşılığı bulunan yetenekler sayılır. Yol haritası, kişisel araştırma yüzeyleri
// ve gelecekteki platformlar bu sayıya dahil değildir.

export const HERMES_FEATURE_INVENTORY_VERSION = '2026-08-09-v1';

export const HERMES_FEATURE_GROUPS = [
  {
    id: 'harita-zodyak',
    baslik: 'Harita & Zodyak',
    giris: 'Natal haritadan güncel gökyüzüne kadar bütün temel hesaplar aynı Swiss Ephemeris çekirdeğinden gelir.',
    gorsel: { src: '/assets/ekranlar/modul-motor.png', cap: 'Yeni nesil 90° harita motoru' },
    items: [
      { ad: 'Natal harita', desc: 'Gezegenler, akslar, evler ve açılarla doğum haritasını saniye hassasiyetinde kurar.' },
      { ad: 'Güncel gökyüzü & Zodyak', desc: 'Seçilen tarih, saat ve konum için gökyüzünü bağımsız bir çalışma alanında inceler.' },
      { ad: 'Klasik & yeni nesil 360° kadran', desc: 'Aynı veriyi iki ayrı görsel dilde, katman ve halka denetimleriyle gösterir.' },
      { ad: 'Ev sistemleri & ayanamsa', desc: 'Farklı ev sistemleri ile tropikal/sidereal çalışma seçeneklerini aynı harita üzerinde uygular.' },
      { ad: 'Katmanlı gezegen kartları', desc: 'Asalet, ev, hız, mizaç, yöneticilik ve açı tanıklarını tek kartta toplar.' },
      { ad: 'Açı gridi & açı kalıpları', desc: 'Açıları matris, sıralı liste ve stelyum, T-kare, büyük üçgen, yod gibi kalıplarla gösterir.' },
      { ad: 'Asteroidler', desc: 'Yerleşik ve kullanıcı tarafından eklenebilen asteroidleri harita, tablo ve filtrelerde hesaplar.' },
      { ad: 'Sabit yıldızlar', desc: 'Presesyonlu konumları, temasları, notları ve deklinasyon verileriyle birlikte inceler.' },
      { ad: 'Arap noktaları & duyarlı noktalar', desc: 'Sect duyarlı lotları ve temel eksen/nokta temaslarını harita bağlamında hesaplar.' },
      { ad: 'Deklinasyonlar', desc: 'Paralel, kontra-paralel, sınır dışı durum ve boylam eşdeğeri deklinasyon tablolarını üretir.' }
    ]
  },
  {
    id: 'zamanlama',
    baslik: 'Zamanlama & Öngörü',
    giris: 'Tek bir tahmin yöntemine dayanmak yerine farklı zamanlama tekniklerini aynı danışan ve olay bağlamında yan yana getirir.',
    gorsel: { src: '/assets/ekranlar/modul-zamanlama.png', cap: 'Transit katmanı ve gezegen bilgi kartı' },
    items: [
      { ad: 'Transitler', desc: 'Güncel ya da seçilmiş gökyüzünü natal haritayla tekli, ikili veya yan yana kadranda karşılaştırır.' },
      { ad: 'Transit tarih aralığı taraması', desc: 'Belirlenen dönemdeki kesin temasları toplu biçimde bulur ve olay listesine taşır.' },
      { ad: 'Sekonder progresyonlar', desc: 'Gün-yıl ilerletmesini farklı gün ve açı yöntemleriyle hesaplar.' },
      { ad: 'Solar Arc', desc: 'Güneş yayı yönlendirmelerini natal ve relokasyon bağlamında gösterir.' },
      { ad: 'Diğer yönelimler', desc: 'Direksiyon ve profeksiyona bağlı yönelim seçeneklerini ayrı çalışma şeridinde sunar.' },
      { ad: 'Return haritaları', desc: 'Solar ve diğer dönüş haritalarını hedef yıl ve bulunulan konuma göre kurar.' },
      { ad: 'Ingress haritaları', desc: 'Gezegen ve zodyak girişlerini kesin anlarıyla haritalaştırır.' },
      { ad: 'Yıllık profeksiyon', desc: 'Aktif ev, burç ve yıl yöneticisini yaş döngüsüne göre hesaplar.' },
      { ad: 'Firdaria', desc: 'Sect temelli dönem ve alt dönem yöneticilerini zaman çizelgesinde gösterir.' },
      { ad: 'Zodyaksal Serbestleşme', desc: 'Lot temelli Zodiacal Releasing dönemlerini katmanlı olarak hesaplar.' },
      { ad: 'Tutulma taraması', desc: 'Güneş ve Ay tutulmalarını tarih aralığında tarar; tam faz ile maksimum an ayrımını korur.' },
      { ad: 'Doğum öncesi tutulma haritaları', desc: 'Prenatal tutulmayı kesin UT anından doğum yeri ve yerel saat bağlamına doğru dönüştürür.' },
      { ad: 'Ay fazları & astroloji takvimi', desc: 'Ay fazlarını ve önemli gökyüzü zamanlarını tarihsel akışta listeler.' },
      { ad: 'Duraklamalar & efemeris tabloları', desc: 'Gezegen istasyonlarını, hareket durumlarını ve tarih aralığı efemeris sonuçlarını tabloya döker.' }
    ]
  },
  {
    id: 'iliski-an',
    baslik: 'İlişki, Soru & Seçim',
    giris: 'İki kişi arasındaki dinamikleri, bir sorunun doğduğu anı ve uygun başlangıç zamanını birbirinden ayrılmış yöntemlerle çalışır.',
    gorsel: { src: '/assets/ekranlar/modul-iliski-soru.png', cap: 'Üç halkalı karşılaştırma kadranı' },
    items: [
      { ad: 'Sinastri', desc: 'İki natal haritanın karşılıklı açılarını, ev düşümlerini ve gezegen temaslarını hesaplar.' },
      { ad: 'İki halkalı karşılaştırma', desc: 'İki haritayı bağımsız yakınlaştırma ve bilgi kartlarıyla aynı çalışma alanında gösterir.' },
      { ad: 'Üç halkalı harita', desc: 'Natal, transit veya türev haritaları üç katmanda birlikte karşılaştırır.' },
      { ad: 'Kompozit harita', desc: 'İki kişinin orta nokta temelli ortak haritasını üretir.' },
      { ad: 'Davison haritası', desc: 'İki doğum verisinin gerçek zaman ve mekân orta noktasından ilişki haritası kurar.' },
      { ad: 'Horary', desc: 'Soru haritası, kayıt arşivi, hesap, not ve klasik değerlendirme akışını bir arada tutar.' },
      { ad: 'Elektif tarama', desc: 'Kriterleri puanlar, tarih aralığını tarar ve uygun aday anları karşılaştırmalı listeler.' }
    ]
  },
  {
    id: 'rektifikasyon',
    baslik: 'Rektifikasyon',
    giris: 'Doğum saatini tek bir işaretten değil, zaman kalitesi belirlenmiş yaşam olayları ve açıklanabilir kanıt katmanlarıyla daraltır.',
    gorsel: { src: '/assets/ekranlar/modul-ileri.png', cap: 'İleri teknikler çalışma alanı' },
    items: [
      { ad: 'Yaşam olayı arşivi', desc: 'Olay tarihi, türü, açıklaması ve zaman kalitesini danışan kaydıyla birlikte saklar.' },
      { ad: 'Olay saati & konum hassasiyeti', desc: 'Kesin saatli olayları ve olay konumlarını ikinci aşama hesaplarında ayrı değerlendirir.' },
      { ad: 'Aday saat aralığı', desc: 'Araştırılacak doğum saati penceresini ve tarama çözünürlüğünü kullanıcı denetiminde tutar.' },
      { ad: 'K0 temel puanlama', desc: 'Kanonik göstergelerle aday saatleri açıklanabilir bir temel sıralamaya yerleştirir.' },
      { ad: 'İnce ızgara taraması', desc: 'Güçlü adayların çevresini daha küçük zaman adımlarıyla yeniden tarar.' },
      { ad: 'Sağlamlık & ablasyon kontrolleri', desc: 'Araştırma katmanlarının sonucu ne ölçüde değiştirdiğini ayrı bantlarla gösterir.' },
      { ad: 'Kalibrasyonlu aday raporu', desc: 'Üst adayları destekleyen, dengeleyen ve dışlanan kanıtları kesinlik iddiası kurmadan raporlar.' }
    ]
  },
  {
    id: 'lokasyon',
    baslik: 'Lokasyon Astrolojisi',
    giris: 'Haritayı yalnız doğum yerine sabitlemez; dünya üzerindeki çizgileri, yönleri ve relokasyon seçeneklerini aynı atlas üzerinde inceler.',
    gorsel: { src: '/assets/ekranlar/ana-4.png', cap: 'Astrokartografi dünya haritası' },
    items: [
      { ad: 'Astrokartografi gezegen çizgileri', desc: 'ASC, DSC, MC ve IC gezegen çizgilerini etkileşimli dünya haritasında gösterir.' },
      { ad: 'Astrokartografi orta noktaları', desc: 'Seçilen orta noktaların dünya üzerindeki açısal hatlarını hesaplar.' },
      { ad: 'Astrokartografi açı çizgileri', desc: 'Gezegenler arası açı ilişkilerini lokasyonel çizgi katmanına taşır.' },
      { ad: 'Astrokartografi sabit yıldızları', desc: 'Sabit yıldızların kesin RA/deklinasyon verileriyle lokasyonel çizgilerini üretir.' },
      { ad: 'Tutulma yolları', desc: 'Tutulma güzergâhlarını lokasyonel inceleme için dünya haritasına ekler.' },
      { ad: 'Local Space', desc: 'Bulunulan noktadan gezegen yönlerini ve ufuk azimutlarını yerel harita üzerinde gösterir.' },
      { ad: 'Geodetik harita', desc: 'Zodyak boylamlarını dünya koordinatlarına eşleyerek geodetik çizgiler üretir.' },
      { ad: 'Relokasyon haritası', desc: 'Natal, return ve yönelim haritalarını seçilen şehir için yeniden evlendirir.' }
    ]
  },
  {
    id: 'uranyen-ileri',
    baslik: 'Uranyen & İleri Hesaplar',
    giris: '90°/360° kadranlardan klasik asalet ve güç ölçümlerine kadar yoğun teknik çalışmaları ayrı araçlara böler.',
    gorsel: { src: '/assets/ekranlar/ana-1.png', cap: 'Yeni nesil 90° Uranyen kadran' },
    items: [
      { ad: 'Klasik 90° kadran', desc: 'Uranyen yerleşimleri klasik simetri ve etiket yerleşimiyle gösterir.' },
      { ad: 'Yeni nesil 90° kadran', desc: 'Aynı 90° geometriyi yakınlaştırma, katman ve gelişmiş çakışma çözümüyle sunar.' },
      { ad: '360° Uranyen kadran', desc: 'Uranyen noktaları tam zodyak çemberinde natal ve karşılaştırmalı haritalarla çalıştırır.' },
      { ad: 'Orta noktalar & ağaçlar', desc: 'Orta nokta listesi, 45° eksen ağacı ve yüklü midpoint ağaçlarını hesaplar.' },
      { ad: 'Hamburg TNP’leri', desc: 'Sekiz Transneptünyeni ayrı görünürlük denetimleriyle kadran ve halkalara ekler.' },
      { ad: 'Uranyen formüller & duyarlı noktalar', desc: 'Gezegen, aks, TNP ve orta nokta birleşimlerini formül temelli inceler.' },
      { ad: 'Harmonik haritalar', desc: 'Seçilen harmonik katsayıyla türev haritayı ve karşılaştırmalı görünümü üretir.' },
      { ad: 'Almuten Figuris', desc: 'Sect, saat yöneticisi ve klasik asalet puanlarıyla haritanın almuten sıralamasını hesaplar.' },
      { ad: 'AstroDyne güç & uyum', desc: 'Gezegen ve burç güçlerini, açı uyum/gerilim değerlerini ölçülebilir tablolarda gösterir.' }
    ]
  },
  {
    id: 'danisan-rapor',
    baslik: 'Danışan & Raporlama',
    giris: 'Hesabı danışmanlık pratiğine bağlar; profil, olay, analiz ve çıktıları aynı danışan kaydında toplar.',
    gorsel: { src: '/assets/ekranlar/modul-atolye.png', cap: 'Analiz Detay Merkezi' },
    items: [
      { ad: 'Danışan yönetimi', desc: 'Kayıt, kategori, arama, toplu işlem ve danışan detay akışını tek merkezde tutar.' },
      { ad: 'Harita & konum profilleri', desc: 'Doğum, ikamet ve çalışma konumlarını danışan bazında saklar; ilgili tekniğe otomatik taşır.' },
      { ad: 'Notlar & olay günlüğü', desc: 'Serbest notları ve tarihli yaşam olaylarını harita bağlamından koparmadan kaydeder.' },
      { ad: 'Analizlerim', desc: 'Natal, öngörü, sinastri, seçim, horary, rektifikasyon ve uzmanlık analizlerini geçmişiyle saklar.' },
      { ad: 'Analiz Detay Merkezi', desc: 'Yönetici özeti, teknik kanıtlar ve sentez/notlar katmanlarını etkileşimli dashboardda birleştirir.' },
      { ad: 'Rapor & A4 belge', desc: 'Harita, tablo ve analiz bölümlerini düzenli ekran ve A4 raporlarına dönüştürür.' },
      { ad: 'PNG, SVG & PDF dışa aktarma', desc: 'Haritayı kadraj, ölçü ve yakınlaştırma seçenekleriyle üç farklı dosya türünde verir.' },
      { ad: 'Solar Fire içe aktarma', desc: 'Solar Fire kayıtlarını sürükle-bırak akışıyla etkin danışan kategorisine aktarır.' }
    ]
  },
  {
    id: 'arastirma-egitim',
    baslik: 'Araştırma, Eğitim & Çalışma Altyapısı',
    giris: 'Kişisel bilgi birikimini, doğrulanmış harita arşivini ve eğitim pratiğini yerel, çevrimdışı bir çalışma düzeninde birleştirir.',
    gorsel: { src: '/assets/ekranlar/modul-kutuphane.png', cap: 'Kütüphane & AA Harita Arşivi' },
    items: [
      { ad: 'Kişisel astroloji kütüphanesi', desc: 'Konu ağacı, tam metin arama, bağlantı grafiği, not ve kaynak düzenleme araçları sunar.' },
      { ad: 'AA Harita Arşivi', desc: 'Kaynak ve veri kalitesi bilgileriyle doğrulanmış doğum haritalarını biyografi ve olaylarıyla inceler.' },
      { ad: 'Kullanıcı istatistikleri & gösterge filtresi', desc: 'Danışan arşivinde gezegen, orta nokta, lot, yıldız ve asteroid ölçütleriyle desen arar.' },
      { ad: 'Astroloji Öğrenme Atölyesi', desc: 'Ders, bilgi kartı, yardım ve ilerleme takibini uygulamanın içinde yürütür.' },
      { ad: 'Öğretmen çalışma alanı', desc: 'Sınıf, öğrenci, ders, ödeme, tahsilat ve arşiv takibini danışan haritalarıyla bağlar.' },
      { ad: 'Dünya atlası', desc: '245 ülke, 133 binden fazla yerleşim ve zaman dilimi verisini çevrimdışı konum seçiminde kullanır.' },
      { ad: 'Çevrimdışı hesap çekirdeği', desc: 'Efemeris ve temel hesaplar programla gelir; harita üretimi için sürekli internet gerekmez.' },
      { ad: 'Yerel veri & yedekleme', desc: 'Danışan ve kütüphane verisini cihazda tutar; güvenli yedekleme ve geri yükleme akışı sağlar.' },
      { ad: '11 tema & imzalı güncellemeler', desc: 'On bir erişilebilir görünüm teması ve doğrulanmış otomatik sürüm güncellemesi sunar.' }
    ]
  }
];

export const HERMES_HOME_FEATURE_CARDS = [
  { glyph: '☉', title: 'Harita & Zodyak', desc: 'Natal harita, güncel gökyüzü, gezegen kartları, açı kalıpları ve hassas noktalar.' },
  { glyph: '☾', title: 'Zamanlama & Öngörü', desc: 'Transit, progresyon, Solar Arc, dönem teknikleri, return, ingress ve tutulmalar.' },
  { glyph: '∞', title: 'İlişki, Soru & Seçim', desc: 'Sinastri, kompozit, Davison, Horary ve tarih aralığı elektif taraması.' },
  { glyph: '⌖', title: 'Rektifikasyon', desc: 'Yaşam olayları, aday saat taraması, sağlamlık kontrolleri ve açıklanabilir rapor.' },
  { glyph: '◎', title: 'Lokasyon Astrolojisi', desc: 'Astrokartografi, Local Space, geodetik çizgiler ve relokasyon haritaları.' },
  { glyph: '⊗', title: 'Uranyen & İleri Hesaplar', desc: '90°/360° kadranlar, orta noktalar, TNP’ler, harmonikler, almuten ve AstroDyne.' },
  { glyph: '❧', title: 'Danışan & Raporlama', desc: 'Danışan kayıtları, olaylar, analiz geçmişi, A4 rapor ve harita dışa aktarma.' },
  { glyph: '☿︎', title: 'Araştırma & Eğitim', desc: 'Kütüphane, AA Harita Arşivi, istatistikler, öğrenme ve öğretmen çalışma alanı.' }
];

export function countHermesFeatures(groups = HERMES_FEATURE_GROUPS) {
  return groups.reduce((total, group) => total + (group.items || []).length, 0);
}

export const HERMES_FEATURE_METRICS = Object.freeze({
  alan: HERMES_FEATURE_GROUPS.length,
  ozellik: countHermesFeatures()
});

export const HERMES_FEATURE_SUMMARY = `${HERMES_FEATURE_METRICS.alan} ana çalışma alanı · ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özellik`;

function isLegacyFeatureInventory(groups = []) {
  const itemCount = countHermesFeatures(groups);
  return groups.some((group) => group.id === 'platform') || groups.length < 8 || itemCount < HERMES_FEATURE_METRICS.ozellik;
}

function isLegacyHomeCards(cards = []) {
  return cards.length < HERMES_HOME_FEATURE_CARDS.length
    || cards.some((card) => card.title === 'Doğum haritası & Zodyak');
}

// Canlı PageContent kaydında kalmış 6 kategori / 23 kısa madde modelini yeni,
// doğrulanmış envantere taşır. Böylece yalnız defaults.js'i değiştirmekle kalmayıp
// mevcut production DB üst yazımını da güvenli biçimde geçersiz kılar.
export function migrateHermesFeatures(model) {
  const groups = model?.ozellikler?.gruplar || [];
  const cards = model?.home?.moduller?.cards || [];
  const nextGroups = isLegacyFeatureInventory(groups) ? HERMES_FEATURE_GROUPS : groups;
  const nextCards = isLegacyHomeCards(cards) ? HERMES_HOME_FEATURE_CARDS : cards;

  return {
    ...model,
    seo: {
      ...model.seo,
      home: {
        ...model.seo?.home,
        description: `Hermes; ${HERMES_FEATURE_METRICS.alan} ana çalışma alanında ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özelliği birleştiren profesyonel masaüstü astroloji programıdır. Şu an Windows 10/11’de; her lisans yalnız bir cihazda geçerlidir.`
      },
      ozellikler: {
        ...model.seo?.ozellikler,
        description: `Hermes’in ${HERMES_FEATURE_METRICS.alan} ana çalışma alanındaki ${HERMES_FEATURE_METRICS.ozellik} çalışan aracı: harita, öngörü, sinastri, horary, rektifikasyon, lokasyon astrolojisi, Uranyen teknikler, danışan, rapor ve araştırma.`
      }
    },
    home: {
      ...model.home,
      moduller: {
        ...model.home?.moduller,
        kicker: `${HERMES_FEATURE_METRICS.alan} ANA ÇALIŞMA ALANI`,
        title: 'Bir astroloğun masasındaki her şey',
        p: `Hermes, ${HERMES_FEATURE_METRICS.alan} ana çalışma alanındaki ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özelliği tek atölyede birleştirir; gelecek platformlar ve yol haritası bu sayıya dahil değildir.`,
        cards: nextCards
      }
    },
    ozellikler: {
      ...model.ozellikler,
      envanterSurumu: HERMES_FEATURE_INVENTORY_VERSION,
      hero: {
        ...model.ozellikler?.hero,
        kicker: 'DOĞRULANMIŞ ÜRÜN ENVANTERİ',
        title: 'Hermes’in çalışma alanları',
        p: `${HERMES_FEATURE_METRICS.alan} ana alandaki ${HERMES_FEATURE_METRICS.ozellik} çalışan araç ve özellik aşağıda tek tek listelenir. Gelecek macOS/mobil sürümleri, senkronizasyon planı ve kişisel geliştirme araçları bu sayıya dahil değildir.`
      },
      gruplar: nextGroups
    }
  };
}
