import PostaClient from './PostaClient';

export const metadata = {
  title: 'Kurumsal Posta Merkezi · Hermes',
  robots: { index: false, follow: false }
};

export default function PostaPage() {
  return <PostaClient />;
}
