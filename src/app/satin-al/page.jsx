import { Nav, Footer } from '@/components/Chrome';
import { JsonLd } from '@/components/JsonLd';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import SatinAlForm from './SatinAlForm';

const PATH = '/satin-al';
const TITLE = 'Hermes Satın Al | Ön Satış Lisansı';
const DESCRIPTION = 'Hermes ön satış lisansını seç; iletişim bilgilerini güvenle ilet. Ekibimiz ödeme ve lisans teslimi için e-posta veya WhatsApp üzerinden dönüş yapsın.';

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
    appNode({ description: DESCRIPTION, price: '6000' })
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
