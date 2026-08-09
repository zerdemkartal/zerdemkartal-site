import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Hermes’i indir',
  robots: { index: false, follow: false }
};

export default function RetiredCustomerAccountSetup() {
  redirect('/indir');
}
