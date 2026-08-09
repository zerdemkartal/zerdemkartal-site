import LisansClient from '../lisans/LisansClient';

export const metadata = {
  title: 'Ödeme ve İndirme Yönetimi',
  robots: { index: false, follow: false }
};

export default function OdemeYonetimPage() {
  return <LisansClient mode="payments" />;
}
