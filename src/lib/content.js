import { prisma } from './db';

/** PageContent oku — satır yoksa fallback (sayfalar Component.DEFAULT'un SSR karşılığını verir). */
export async function getContent(key, fallback = null) {
  try {
    const row = await prisma.pageContent.findUnique({ where: { key } });
    return row?.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getSettings() {
  try {
    const row = await prisma.setting.findUnique({ where: { id: 1 } });
    return row?.data ?? null;
  } catch {
    return null;
  }
}
