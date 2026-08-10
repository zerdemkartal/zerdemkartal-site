import { requireAdmin } from '@/lib/auth';
import {
  createPaytrCallbackId,
  createPaytrLink
} from '@/lib/paytr.mjs';

export const runtime = 'nodejs';

const TEST_PAYMENT_KURUS = 1000;

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const callbackId = createPaytrCallbackId({
      deviceLimit: 1,
      netKurus: TEST_PAYMENT_KURUS,
      paymentKurus: TEST_PAYMENT_KURUS,
      testMode: true
    });
    const result = await createPaytrLink({
      deviceLimit: 1,
      paymentKurus: TEST_PAYMENT_KURUS,
      callbackId,
      testMode: true
    });

    return Response.json({
      paymentPageUrl: result.paymentPageUrl,
      amountTl: TEST_PAYMENT_KURUS / 100,
      expiresInMinutes: 30,
      testMode: true
    }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('[paytr-test-link]', {
      code: error?.code || 'PAYTR_TEST_LINK_FAILED',
      reason: String(error?.message || '').slice(0, 160)
    });
    return Response.json(
      { error: 'test_odeme_baglantisi_olusturulamadi' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
