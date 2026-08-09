import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ingestContactForm } from '@/lib/mail';
import { z } from 'zod';

const LeadIn = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  type: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(10_000),
  website: z.string().max(200).optional(),
  formStartedAt: z.number().int().positive().optional()
});

// POST /api/leads — iletişim formu; talep ve Posta Merkezi konuşması birlikte oluşur.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = LeadIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Form alanlarını kontrol edin.' }, { status: 400 });
  const now = Date.now();
  if (body?.website || (parsed.data.formStartedAt && now - parsed.data.formStartedAt < 2_000)) {
    return Response.json({ ok: true, id: 'accepted' }, { status: 201 });
  }
  const since = new Date(now - 60 * 60 * 1000);
  const recent = await prisma.lead.count({
    where: { email: parsed.data.email.toLowerCase(), createdAt: { gte: since } }
  });
  if (recent >= 5) {
    return Response.json({ error: 'Çok sayıda istek alındı. Lütfen daha sonra tekrar deneyin.' }, { status: 429 });
  }
  const duplicate = await prisma.lead.findFirst({
    where: {
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message,
      createdAt: { gte: new Date(now - 10 * 60 * 1000) }
    },
    select: { id: true }
  });
  if (duplicate) return Response.json({ ok: true, id: duplicate.id }, { status: 200 });
  const sonuc = await ingestContactForm(parsed.data);
  return Response.json({ ok: true, id: sonuc.lead.id }, { status: 201 });
}

// GET /api/leads — eski yönetim/MCP uyumluluğu.
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 250 });
  return Response.json(rows);
}
