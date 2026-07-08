import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/members — admin, salt-okunur (şifre hash'i asla dönmez)
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.member.findMany({
    orderBy: { joinedAt: 'desc' },
    select: { id: true, name: true, email: true, provider: true, birth: true, joinedAt: true }
  });
  return Response.json(rows);
}
