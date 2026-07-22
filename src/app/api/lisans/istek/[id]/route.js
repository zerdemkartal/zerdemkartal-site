import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const PatchIn = z.object({
  status: z.enum(['bekliyor', 'imzalandi', 'gonderildi', 'reddedildi']).optional(),
  note: z.string().max(2000).optional()
});

// PATCH /api/lisans/istek/:id — admin: imzalandı/gönderildi işaretle + not (çevrimdışı imza takibi).
export async function PATCH(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const body = await request.json().catch(() => null);
  const p = PatchIn.safeParse(body);
  if (!p.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const row = await prisma.licenseRequest.update({ where: { id: params.id }, data: p.data }).catch(() => null);
  if (!row) return Response.json({ error: 'istek bulunamadı' }, { status: 404 });
  return Response.json(row);
}
