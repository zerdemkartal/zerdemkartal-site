import { prisma } from '@/lib/db';
import { requireMemberEmail } from '@/lib/auth';
import { pubMember } from '@/lib/member';
import { z } from 'zod';

// GET /api/uye/me — açık oturumun profili + Astroloji 101 ilerlemesi
export async function GET(request) {
  const who = requireMemberEmail(request); if (who instanceof Response) return who;
  const row = await prisma.member.findUnique({ where: { email: who } });
  if (!row) return Response.json({ error: 'hesap bulunamadı' }, { status: 404 });
  return Response.json({ ...pubMember(row), progress: row.progress ?? null });
}

const MeIn = z.object({
  name: z.string().min(2).max(120).optional(),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  progress: z.any().optional() // zk_astroloji101_progress snapshot'ı (cihazlar arası senkron)
});

// PUT /api/uye/me — profil + ilerleme güncelle
export async function PUT(request) {
  const who = requireMemberEmail(request); if (who instanceof Response) return who;
  const body = await request.json().catch(() => null);
  const parsed = MeIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const d = parsed.data;
  const data = {};
  if (d.name !== undefined) data.name = d.name;
  if (d.birth !== undefined) data.birth = d.birth;
  if (d.progress !== undefined) data.progress = d.progress;
  const row = await prisma.member.update({ where: { email: who }, data }).catch(() => null);
  if (!row) return Response.json({ error: 'hesap bulunamadı' }, { status: 404 });
  return Response.json({ ...pubMember(row), progress: row.progress ?? null });
}
