import LisansClient from './LisansClient';

export const metadata = {
  title: 'Lisans Yönetimi',
  robots: { index: false, follow: false }
};

export default function LisansYonetimPage() {
  return <LisansClient />;
}
