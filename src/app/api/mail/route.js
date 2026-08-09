import { prisma } from '@/lib/db';
import { requireMailAccess } from '@/lib/auth';
import { mailboxAddresses } from '@/lib/mail';

export const dynamic = 'force-dynamic';

const KLASORLER = new Set(['inbox', 'sent', 'archive', 'spam', 'trash', 'starred']);

function klasorKosulu(folder) {
  if (folder === 'sent') return {
    folder: { notIn: ['spam', 'trash'] },
    messages: { some: { direction: 'outbound' } }
  };
  if (folder === 'starred') return { starred: true, folder: { notIn: ['spam', 'trash'] } };
  return { folder };
}

export async function GET(request) {
  const err = await requireMailAccess(request, prisma, 'posta.goruntule'); if (err) return err;
  const url = new URL(request.url);
  const folder = KLASORLER.has(url.searchParams.get('folder')) ? url.searchParams.get('folder') : 'inbox';
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 120);
  const where = {
    ...klasorKosulu(folder),
    ...(q ? {
      OR: [
        { subject: { contains: q, mode: 'insensitive' } },
        { participantName: { contains: q, mode: 'insensitive' } },
        { participantEmail: { contains: q, mode: 'insensitive' } },
        { messages: { some: { text: { contains: q, mode: 'insensitive' } } } }
      ]
    } : {})
  };

  const [threads, inbox, archive, spam, trash, starred, sent, unread] = await Promise.all([
    prisma.mailThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, direction: true, fromAddress: true, text: true, subject: true, createdAt: true, attachments: true }
        },
        _count: { select: { messages: true } }
      }
    }),
    prisma.mailThread.count({ where: { folder: 'inbox' } }),
    prisma.mailThread.count({ where: { folder: 'archive' } }),
    prisma.mailThread.count({ where: { folder: 'spam' } }),
    prisma.mailThread.count({ where: { folder: 'trash' } }),
    prisma.mailThread.count({ where: { starred: true, folder: { notIn: ['spam', 'trash'] } } }),
    prisma.mailThread.count({ where: {
      folder: { notIn: ['spam', 'trash'] },
      messages: { some: { direction: 'outbound' } }
    } }),
    prisma.mailThread.aggregate({ where: { folder: 'inbox' }, _sum: { unreadCount: true } })
  ]);

  return Response.json({
    folder,
    mailboxes: mailboxAddresses(),
    configured: {
      sending: Boolean(process.env.RESEND_API_KEY),
      receiving: Boolean(process.env.RESEND_WEBHOOK_SECRET)
    },
    counts: { inbox, archive, spam, trash, starred, sent, unread: unread._sum.unreadCount || 0 },
    threads: threads.map((thread) => ({
      ...thread,
      lastMessage: thread.messages[0] || null,
      messages: undefined
    }))
  });
}
