import { prisma } from '@/lib/db';
import { requireMailAccess } from '@/lib/auth';
import { z } from 'zod';

const Input = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  action: z.enum(['archive', 'spam', 'trash', 'inbox', 'read', 'unread', 'star', 'unstar'])
}).strict();

export async function POST(request) {
  const err = await requireMailAccess(request, prisma, 'posta.duzenle'); if (err) return err;
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Toplu işlem geçersiz.' }, { status: 400 });
  const { ids, action } = parsed.data;
  const data = action === 'archive' ? { folder: 'archive' }
    : action === 'spam' ? { folder: 'spam', unreadCount: 0 }
      : action === 'trash' ? { folder: 'trash', unreadCount: 0 }
        : action === 'inbox' ? { folder: 'inbox' }
          : action === 'read' ? { unreadCount: 0 }
            : action === 'unread' ? { unreadCount: 1 }
              : action === 'star' ? { starred: true }
                : { starred: false };
  const result = await prisma.mailThread.updateMany({ where: { id: { in: ids } }, data });
  if (action === 'read') {
    await prisma.mailMessage.updateMany({
      where: { threadId: { in: ids }, direction: 'inbound', readAt: null },
      data: { readAt: new Date() }
    });
  }
  return Response.json({ ok: true, updated: result.count });
}
