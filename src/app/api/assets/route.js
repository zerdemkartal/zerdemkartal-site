import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// POST /api/assets — admin, multipart {file, slotId} → {url}
// İskelet sürümü dosyayı public/uploads/'a yazar; ÜRETİMDE S3/R2'ye çevir (FAZLAR §2.5).
export async function POST(request) {
  const err = requireAdmin(request); if (err) return err;
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const slotId = form?.get('slotId');
  if (!file || typeof file === 'string' || !slotId) return Response.json({ error: 'file + slotId gerekli' }, { status: 400 });
  if (!/^image\//.test(file.type)) return Response.json({ error: 'sadece görsel' }, { status: 415 });

  const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const name = `${String(slotId).replace(/[^a-z0-9_-]/gi, '')}-${Date.now().toString(36)}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${name}`;
  await prisma.asset.upsert({
    where: { slotId: String(slotId) },
    create: { slotId: String(slotId), url, mime: file.type, size: file.size },
    update: { url, mime: file.type, size: file.size }
  });
  return Response.json({ ok: true, url }, { status: 201 });
}

// GET /api/assets — public: slotId → url haritası (image-slot'lar bunu okur)
export async function GET() {
  const rows = await prisma.asset.findMany({ select: { slotId: true, url: true } });
  return Response.json(Object.fromEntries(rows.map((r) => [r.slotId, r.url])));
}
