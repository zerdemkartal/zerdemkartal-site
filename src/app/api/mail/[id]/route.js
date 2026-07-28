import { prisma } from '@/lib/db';
import { requireMailAccess } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchIn = z.object({
  folder: z.enum(['inbox', 'archive', 'spam']).optional(),
  starred: z.boolean().optional(),
  read: z.boolean().optional()
}).refine((x) => Object.keys(x).length > 0);

export async function GET(request, { params }) {
  const err = requireMailAccess(request); if (err) return err;
  const thread = await prisma.mailThread.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!thread) return Response.json({ error: 'Konuşma bulunamadı.' }, { status: 404 });

  if (thread.unreadCount > 0) {
    const now = new Date();
    await prisma.$transaction([
      prisma.mailThread.update({ where: { id: thread.id }, data: { unreadCount: 0 } }),
      prisma.mailMessage.updateMany({
        where: { threadId: thread.id, direction: 'inbound', readAt: null },
        data: { readAt: now }
      })
    ]);
    thread.unreadCount = 0;
    thread.messages.forEach((m) => { if (m.direction === 'inbound' && !m.readAt) m.readAt = now; });
  }
  return Response.json(thread);
}

export async function PATCH(request, { params }) {
  const err = requireMailAccess(request); if (err) return err;
  const parsed = PatchIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  const data = {};
  if (parsed.data.folder) data.folder = parsed.data.folder;
  if (typeof parsed.data.starred === 'boolean') data.starred = parsed.data.starred;
  if (typeof parsed.data.read === 'boolean') data.unreadCount = parsed.data.read ? 0 : 1;
  const thread = await prisma.mailThread.update({ where: { id: params.id }, data }).catch(() => null);
  if (!thread) return Response.json({ error: 'Konuşma bulunamadı.' }, { status: 404 });
  if (parsed.data.read === true) {
    await prisma.mailMessage.updateMany({
      where: { threadId: params.id, direction: 'inbound', readAt: null },
      data: { readAt: new Date() }
    });
  }
  return Response.json(thread);
}
