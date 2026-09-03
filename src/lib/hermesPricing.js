const digits = (value) => String(value || '').replace(/[^0-9]/g, '');

const PRICE_FAQ = [
  { q: 'Program lisansı abonelik mi?', a: 'Hayır. Program lisansı tek seferlik satın alınır ve etkinleştirildiği bir cihazda geçerlidir.' },
  { q: 'Her lisans kaç cihazda geçerli?', a: 'Bir cihazda. Farklı veya ikinci bir cihazda kullanmak için o cihaz adına ayrı lisans gerekir.' },
  { q: 'Kart fiyatı nasıl belirleniyor?', a: 'Tek çekim kart fiyatı, EFT/Havale hedef tutarı ve PayTR’nin güncel mağaza oranıyla otomatik hesaplanır. Taksitli toplam PayTR ekranında karta ve vadeye göre değişebilir.' },
  { q: 'Güncellemeler ücretli mi?', a: 'Aynı cihaz için yayımlanan program güncellemeleri lisansa dahildir.' },
  { q: 'Cihazlar arası senkronizasyon lisansa dahil mi?', a: 'Hayır. Veri senkronizasyonu ileride isteğe bağlı ve ayrı bir abonelik hizmeti olarak sunulacaktır.' },
  { q: 'İade var mı?', a: 'Mesafeli satış koşulları geçerlidir; ayrıntı için İptal & İade sayfasına bak.' }
];

const POLICY_FAQ = {
  'Lisans nasıl çalışıyor?': 'Program lisansı tek seferlik satın alınır ve yalnız etkinleştirildiği bir cihazda geçerlidir. Farklı veya ikinci cihaz için ayrı lisans gerekir. 1 cihaz EFT/Havale fiyatı ₺8.500; ikinci cihaz lisansı +₺3.000, iki cihaz toplam ₺11.500’dür. Aynı cihaz için yayımlanan güncellemeler dahildir.',
  'Verilerim nerede tutuluyor?': 'Varsayılan olarak cihazında. Danışan kayıtların ve haritaların bilgisayarından çıkmaz; bulut zorunluluğu yoktur. İnternet yalnız lisans doğrulama ve güncelleme için kullanılır.',
  'Hangi platformlarda çalışıyor?': 'Hermes şu an Windows 10/11 (64-bit) bilgisayarlarda kullanılabilir. macOS sürümü 17 Ağustos 2026’da sunulacaktır. Android, iPhone ve iPad sürümleri daha sonra gelecektir.',
  'Cihazlar arasında veri senkronizasyonu olacak mı?': 'Evet, ileride isteğe bağlı bir hizmet olarak sunulması planlanıyor. Senkronizasyon program lisansına dahil değildir ve ayrı abonelik gerektirecektir.'
};

function migrateGeneralFaq(items = []) {
  const retiredQuestions = new Set(['Web sürümü olacak mı?', 'Android, iPhone ve iPad sürümleri olacak mı?']);
  const migrated = items
    .filter((item) => !retiredQuestions.has(item.q))
    .map((item) => POLICY_FAQ[item.q] ? { ...item, a: POLICY_FAQ[item.q] } : item);

  migrated.splice(Math.min(4, migrated.length), 0, {
    q: 'Android, iPhone ve iPad sürümleri olacak mı?',
    a: 'Evet. Android, iPhone ve iPad sürümleri yol haritasındadır ve daha sonra yayımlanacaktır. Her cihaz için ayrı lisans gerekir.'
  });

  for (const q of ['Cihazlar arasında veri senkronizasyonu olacak mı?']) {
    if (!migrated.some((item) => item.q === q)) migrated.splice(Math.min(7, migrated.length), 0, { q, a: POLICY_FAQ[q] });
  }
  return migrated;
}

function migratePlatformGroup(groups = []) {
  return groups.map((group) => {
    if (group.id !== 'platform') return group;
    const items = (group.items || []).filter((item) => item.ad !== 'Cihazlar arası senkronizasyon').map((item) => (
      item.ad === 'Yol haritası'
        ? { ...item, desc: 'macOS sürümü 17 Ağustos 2026’da sunulacak; Android, iPhone ve iPad sürümleri daha sonra gelecek. Her cihaz için ayrı lisans gerekir.' }
        : item
    ));
    items.push({ ad: 'Cihazlar arası senkronizasyon', desc: 'İleride isteğe bağlı, ayrı bir abonelik hizmeti olarak sunulacaktır; program lisansına dahil değildir.' });
    return { ...group, giris: 'Hermes bugün Windows bilgisayarlarda kullanılabilir; her cihaz kendi lisansını gerektirir.', items };
  });
}

/**
 * Canlı içerik kaynağındaki eski fiyat, platform ve lisans metinlerini güncel
 * ticari sözleşmeye taşır. Fiyat alanlarına yalnız bilinen 5.000/6.000/8.500 kümelerinde
 * dokunur; tek-cihaz ve senkronizasyon kapsamı ise eski DB metinlerini de ezer.
 */
export function migrateHermesPricing(model) {
  const box = model?.fiyat?.kutu || {};
  const knownPricing = ['5000', '6000', '8500'].includes(digits(box.price));
  const currentBox = knownPricing
    ? {
        ...box,
        kicker: 'EFT / HAVALE FİYATI',
        price: '₺8.500',
        oldPrice: '',
        secondLicensePrice: '₺3.000',
        secondPrice: '₺11.500',
        vatNote: 'Fiyatlara KDV dahildir.',
        rows: [
          '☿︎ Tüm modüller — sınırsız harita ve danışan',
          '☿︎ Windows 10/11 (64-bit) — şimdi',
          '☿︎ Her lisans yalnız bir cihazda geçerlidir',
          '☿︎ Farklı cihaz için ayrı lisans gerekir',
          '☿︎ Aynı cihaz için yayımlanan güncellemeler dahil'
        ]
      }
    : box;

  const generalFaq = migrateGeneralFaq(model?.sss?.items || []);

  return {
    ...model,
    seo: {
      ...model.seo,
      home: {
        ...model.seo?.home,
        description: 'Hermes: doğum haritası, transit, sinastri, horary, rektifikasyon ve astrokartografi tek programda. Şu an Windows 10/11’de. Her lisans yalnız bir cihazda geçerlidir.'
      },
      fiyat: {
        ...model.seo?.fiyat,
        title: 'Fiyat — Hermes | Tek seferlik cihaz lisansı',
        description: knownPricing
          ? 'Hermes 1 cihaz EFT/Havale fiyatı ₺8.500; farklı veya ikinci cihaz için ayrı lisans gerekir. İkinci cihaz lisansı +₺3.000, iki cihaz toplam ₺11.500’dür.'
          : model.seo?.fiyat?.description
      },
      sss: {
        ...model.seo?.sss,
        description: 'Hermes hakkında merak edilenler: cihaz lisansı, ödeme, güncellemeler, çevrimdışı çalışma, veri gizliliği, platform yol haritası ve senkronizasyon.'
      }
    },
    home: {
      ...model.home,
      hero: { ...model.home?.hero, btn2: 'Satın al', btn2Href: '/satin-al' },
      fiyatBand: knownPricing
        ? {
            ...model.home?.fiyatBand,
            kicker: 'TEK SEFERLİK CİHAZ LİSANSI',
            title: '1 cihaz EFT/Havale ₺8.500.',
            p: 'Her lisans yalnız bir cihazda geçerlidir. İkinci cihaz için ayrı lisans +₺3.000; iki cihaz toplam ₺11.500’dür. Aynı cihaz için yayımlanan güncellemeler dahildir. Cihazlar arası veri senkronizasyonu ileride ayrı abonelik hizmeti olarak sunulacaktır.'
          }
        : model.home?.fiyatBand
    },
    ozellikler: {
      ...model.ozellikler,
      gruplar: migratePlatformGroup(model.ozellikler?.gruplar || [])
    },
    fiyat: {
      ...model.fiyat,
      hero: {
        ...model.fiyat?.hero,
        title: 'Her cihaz için ayrı lisans.',
        p: 'Hermes program lisansı tek seferliktir ve yalnız etkinleştirildiği bir cihazda geçerlidir. Farklı bir cihazda kullanmak için o cihaz adına ayrı lisans gerekir.'
      },
      kutu: currentBox,
      tekLisans: {
        ...model.fiyat?.tekLisans,
        title: 'Platform ve cihaz planı',
        p: 'Windows ve Mac bilgisayarlar ile Android telefon veya tablet, iPhone ve iPad ayrı cihaz sayılır. Yeni bir cihazda Hermes kullanmak için o cihaz adına ayrı lisans alınır.',
        rows: [
          'Windows 10/11 (64-bit) — şimdi',
          'macOS — 17 Ağustos 2026',
          'Android · iPhone · iPad — daha sonra',
          'Cihazlar arası veri senkronizasyonu — ileride ayrı abonelik hizmeti'
        ]
      },
      sss: PRICE_FAQ
    },
    indir: {
      ...model.indir,
      sistem: {
        ...model.indir?.sistem,
        not: 'macOS sürümü 17 Ağustos 2026’da sunulacaktır. Android, iPhone ve iPad sürümleri daha sonra gelecektir. Her cihaz ayrı lisans gerektirir; cihazlar arası veri senkronizasyonu ileride ayrı abonelik hizmeti olarak sunulacaktır.'
      }
    },
    sss: { ...model.sss, items: generalFaq }
  };
}
