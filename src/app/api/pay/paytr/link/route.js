import { z } from 'zod';
import {
  PAYTR_TERMS_VERSION,
  createPaytrCallbackId,
  createPaytrLink,
  getPaytrPricing
} from '@/lib/paytr.mjs';

export const runtime = 'nodejs';

const LinkRequest = z.object({
  planId: z.enum(['hermes-1', 'hermes-2']),
  termsAccepted: z.literal(true),
  termsVersion: z.literal(PAYTR_TERMS_VERSION)
}).strict();

export async function POST(request) {
  const parsed = LinkRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'secim_ve_sozlesme_gecersiz' }, { status: 400 });
  }

  try {
    const pricing = await getPaytrPricing();
    if (!pricing.configured) {
      return Response.json({ error: 'kartli_odeme_yapilandirilmadi' }, { status: 503 });
    }
    const plan = pricing.plans.find((item) => item.planId === parsed.data.planId);
    if (!plan?.cardKurus) throw new Error('Plan fiyatı bulunamadı.');
    const callbackId = createPaytrCallbackId({
      deviceLimit: plan.deviceLimit,
      netKurus: Math.round(plan.eftPrice * 100),
      paymentKurus: plan.cardKurus
    });
    const result = await createPaytrLink({
      deviceLimit: plan.deviceLimit,
      paymentKurus: plan.cardKurus,
      callbackId
    });
    return Response.json(
      { paymentPageUrl: result.paymentPageUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'odeme_baglantisi_olusturulamadi' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
