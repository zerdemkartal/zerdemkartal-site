import { ingestPurchaseRequest } from '@/lib/mail';
import { z } from 'zod';

const PurchaseIn = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(10).max(28).regex(/^[+()\d\s.-]+$/),
  deviceLimit: z.union([z.literal(1), z.literal(2)]),
  kvkk: z.literal(true),
  website: z.string().max(200).optional()
});

function telefonNormalize(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return { display: `+${digits}`, whatsapp: digits };
}

export async function POST(request) {
  const parsed = PurchaseIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Ad, soyad, e-posta ve telefon bilgilerini kontrol edin.' }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true }, { status: 201 });

  const phone = telefonNormalize(parsed.data.phone);
  if (!phone) return Response.json({ error: 'Telefon numarasını ülke koduyla birlikte kontrol edin.' }, { status: 400 });

  const sonuc = await ingestPurchaseRequest({
    ...parsed.data,
    phone: phone.display,
    whatsappPhone: phone.whatsapp
  });
  return Response.json({ ok: true, id: sonuc.lead.id, threadId: sonuc.thread.id }, { status: 201 });
}
