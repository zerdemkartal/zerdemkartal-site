import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Üye hesabı çok yakında — Hermes',
  robots: { index: false, follow: false }
};
export const dynamic = 'force-dynamic';

export default function Uye() {
  redirect('/cok-yakinda');
}
