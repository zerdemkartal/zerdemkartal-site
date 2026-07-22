import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const PatchIn = z.object({ status: z.enum(['pending', 'paid', 'delivered', 'cancelled']) });

// PATCH /api/orders/:id — admin: teslim işaretle (lisans e-postası gönderildi vb.)
export async function PATCH(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const body = await request.json().catch(() => null);
  const parsed = PatchIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const row = await prisma.order.update({ where: { id: params.id }, data: parsed.data }).catch(() => null);
  if (!row) return Response.json({ error: 'sipariş bulunamadı' }, { status: 404 });
  return Response.json(row);
}
