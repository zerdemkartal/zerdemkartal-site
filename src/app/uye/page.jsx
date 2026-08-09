import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Hermes Lisans ve İndirme',
  robots: { index: false, follow: false }
};
export const dynamic = 'force-dynamic';

export default function Uye() {
  redirect('/indir');
}
