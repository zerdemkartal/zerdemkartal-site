// /yonetim — yönetim girişi. noindex (arama motoru + AI botları görmemeli). Sunucu sarmalı;
// giriş mantığı YonetimClient'ta. Giriş = ADMIN_TOKEN → sessionStorage 'h_admin_key'.
// Sonra sayfalara gidince sağ altta EditLayer araç çubuğu çıkar (yerinde düzenleme + SEO).
import YonetimClient from './YonetimClient';

export const metadata = {
  title: 'Yönetim',
  robots: { index: false, follow: false }
};

export default function YonetimPage() {
  return <YonetimClient />;
}
