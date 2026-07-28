const digits = (value) => String(value || '').replace(/[^0-9]/g, '');

/**
 * Canlı içerik kaynağındaki eski fiyat üçlüsünü yeni ticari sözleşmeye taşır.
 * Yalnız 5.000 / 10.000 / 7.500 eski kümesi eşleşirse çalışır; sonraki CMS
 * fiyat değişikliklerine karışmaz.
 */
export function migrateHermesPricing(model) {
  const box = model?.fiyat?.kutu;
  const legacyPricing =
    digits(box?.price) === '5000' &&
    digits(box?.oldPrice) === '10000' &&
    digits(box?.secondPrice) === '7500';

  if (!legacyPricing) return model;

  const priceFaq = (model.fiyat.sss || []).map((item) => (
    item.q === 'Ön satış ne demek?'
      ? {
          ...item,
          a: 'Program aktif geliştirmededir; ön satış fiyatı ₺6.000, program fiyatı ₺8.500’dür. İkinci cihaz lisansı +₺2.500’dür. Fiyatlara KDV dahildir.'
        }
      : item
  ));
  const generalFaq = (model.sss?.items || []).map((item) => (
    item.q === 'Lisans nasıl çalışıyor?'
      ? {
          ...item,
          a: 'Tek seferlik satın alma; abonelik yok. Ön satış lisansı 1 cihaz için ₺6.000’dir. İkinci cihaz lisansı +₺2.500; iki cihaz toplam ₺8.500’dür. Fiyatlara KDV ve çıkan tüm güncellemeler dahildir.'
        }
      : item
  ));

  return {
    ...model,
    seo: {
      ...model.seo,
      fiyat: {
        ...model.seo?.fiyat,
        description: 'Hermes ön satış fiyatı ₺6.000; program fiyatı ₺8.500. İkinci cihaz lisansı +₺2.500, iki cihaz toplam ₺8.500. Fiyatlara KDV dahildir; abonelik yoktur.'
      }
    },
    home: {
      ...model.home,
      hero: {
        ...model.home?.hero,
        btn2: 'Ön satışa katıl — ₺6.000'
      },
      fiyatBand: {
        ...model.home?.fiyatBand,
        kicker: 'ÖN SATIŞ',
        title: 'Ön satış ₺6.000, program fiyatı ₺8.500.',
        p: 'Ön satış lisansı 1 cihaz için ₺6.000’dir. İkinci cihaz lisansı +₺2.500; iki cihaz toplam ₺8.500’dür. Fiyatlara KDV dahildir. Abonelik yok; güncellemeler ve yol haritasındaki web/Android erişimi dahildir.'
      }
    },
    fiyat: {
      ...model.fiyat,
      kutu: {
        ...box,
        price: '₺6.000',
        oldPrice: '₺8.500',
        secondLicensePrice: '₺2.500',
        secondPrice: '₺8.500',
        vatNote: 'Fiyatlara KDV dahildir.'
      },
      sss: priceFaq
    },
    sss: {
      ...model.sss,
      items: generalFaq
    }
  };
}
