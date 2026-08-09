import { permanentRedirect } from 'next/navigation';

// Eski hazırlık sayfası canlı mağaza incelemesinde demo/bitmemiş içerik
// oluşturmaması için kalıcı olarak güncel satın alma sayfasına gider.
export default function CokYakinda() {
  permanentRedirect('/satin-al');
}
