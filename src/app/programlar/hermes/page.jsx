import { makeProgramPage } from '@/components/ProgramDetay';
import { PD_HERMES } from '@/lib/defaults';

export const revalidate = 300;

const { generateMetadata, Page } = makeProgramPage({
  key: 'pd_hermes',
  def: PD_HERMES,
  path: '/programlar/hermes',
  name: 'Hermes',
  paid: true,
  seoDef: {
    title: 'Hermes Astroloji Programı — Profesyonel Masaüstü Yazılım | zerdemkartal',
    description: 'Hermes: profesyonel masaüstü astroloji programı. Doğum haritası, transitler, sinastri ve öngörü teknikleri — ön satışa özel tek seferlik lisans.'
  }
});

export { generateMetadata };
export default Page;
