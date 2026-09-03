import { Nav, Footer } from '@/components/Chrome';
import { JsonLd } from '@/components/JsonLd';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { LICENSE_DEVICE_PRICES } from '@/lib/licensePricing';
import SatinAlForm from './SatinAlForm';

const PATH = '/satin-al';
const TITLE = 'Hermes Satın Al | EFT veya PayTR ile Kartlı Ödeme';
const DESCRIPTION = 'Hermes lisansını seç; EFT/Havale ile ₺8.500’den satın al veya PayTR’nin güncel oranına göre otomatik hesaplanan kart fiyatıyla güvenli ödeme yap.';

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH });

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    ORG,
    WEBSITE,
    {
      '@type': 'WebPage',
      '@id': SITE + PATH + '#webpage',
      url: SITE + PATH,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'tr-TR',
      isPartOf: { '@id': SITE + '/#site' },
      about: { '@id': SITE + '/#hermes' }
    },
    appNode({ description: DESCRIPTION, price: String(LICENSE_DEVICE_PRICES[1]) })
  ]
};

export default function SatinAl() {
  return (
    <main>
      <JsonLd data={jsonLd} />
      <Nav active="/fiyat" />
      <SatinAlForm />
      <Footer />
    </main>
  );
}
