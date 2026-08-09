import { prisma } from '@/lib/db';
import { requireMailAccess } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchIn = z.object({
  folder: z.enum(['inbox', 'archive', 'spam', 'trash']).optional(),
  starred: z.boolean().optional(),
  read: z.boolean().optional(),
  blockSender: z.boolean().optional()
}).refine((x) => Object.keys(x).length > 0);

const DeleteIn = z.object({ confirm: z.literal('SİL') }).strict();

export async function GET(request, props) {
  const params = await props.params;
  const err = await requireMailAccess(request, prisma, 'posta.goruntule');if (err) return err;
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

export async function PATCH(request, props) {
  const params = await props.params;
  const err = await requireMailAccess(request, prisma, 'posta.duzenle');if (err) return err;
  const parsed = PatchIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  const current = await prisma.mailThread.findUnique({ where: { id: params.id } });
  if (!current) return Response.json({ error: 'Konuşma bulunamadı.' }, { status: 404 });
  if (typeof parsed.data.blockSender === 'boolean' && current.participantEmail) {
    const folder = parsed.data.blockSender ? 'spam' : 'inbox';
    await prisma.mailThread.updateMany({
      where: {
        participantEmail: current.participantEmail,
        ...(parsed.data.blockSender ? {} : { folder: 'spam' })
      },
      data: parsed.data.blockSender ? { folder, unreadCount: 0 } : { folder }
    });
  }
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

export async function DELETE(request, props) {
  const params = await props.params;
  const err = await requireMailAccess(request, prisma, 'posta.duzenle'); if (err) return err;
  const parsed = DeleteIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Kalıcı silme onayı geçersiz.' }, { status: 400 });
  const current = await prisma.mailThread.findUnique({ where: { id: params.id }, select: { id: true, folder: true } });
  if (!current) return Response.json({ error: 'Konuşma bulunamadı.' }, { status: 404 });
  if (current.folder !== 'trash') {
    return Response.json({ error: 'Konuşma kalıcı silmeden önce Çöp klasörüne taşınmalıdır.' }, { status: 409 });
  }
  await prisma.mailThread.delete({ where: { id: current.id } });
  return Response.json({ ok: true, deletedId: current.id });
}
