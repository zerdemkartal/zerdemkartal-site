import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const PatchIn = z.object({
  status: z.enum(['new', 'seen', 'done']).optional(), // panel: YENİ → GÖRÜŞÜLDÜ → TAMAM
  note: z.string().max(2000).optional()
});

// PATCH /api/leads/:id — admin: durum + not
export async function PATCH(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const body = await request.json().catch(() => null);
  const parsed = PatchIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const row = await prisma.lead.update({ where: { id: params.id }, data: parsed.data }).catch(() => null);
  if (!row) return Response.json({ error: 'talep bulunamadı' }, { status: 404 });
  return Response.json(row);
}
