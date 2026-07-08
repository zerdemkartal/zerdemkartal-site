import { makeProgramPage } from '@/components/ProgramDetay';
import { PD_ASTROPEN } from '@/lib/defaults';

export const revalidate = 300;

const { generateMetadata, Page } = makeProgramPage({
  key: 'pd_astropen',
  def: PD_ASTROPEN,
  path: '/programlar/astropen',
  name: 'AstroPen',
  paid: false,
  seoDef: {
    title: 'AstroPen — Ücretsiz Masaüstü Astroloji Programı | zerdemkartal',
    description: 'AstroPen: doğum haritanı saniyeler içinde çıkaran, gökyüzünü senin dilinde yazan ücretsiz masaüstü astroloji programı. Windows ve macOS için.'
  }
});

export { generateMetadata };
export default Page;
