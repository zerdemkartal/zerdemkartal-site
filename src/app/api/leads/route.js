import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ingestContactForm } from '@/lib/mail';
import { z } from 'zod';

const LeadIn = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  type: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(10_000)
});

// POST /api/leads — iletişim formu; talep ve Posta Merkezi konuşması birlikte oluşur.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = LeadIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Form alanlarını kontrol edin.' }, { status: 400 });
  const sonuc = await ingestContactForm(parsed.data);
  return Response.json({ ok: true, id: sonuc.lead.id }, { status: 201 });
}

// GET /api/leads — eski yönetim/MCP uyumluluğu.
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 250 });
  return Response.json(rows);
}
