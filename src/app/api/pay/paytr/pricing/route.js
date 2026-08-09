import { getPaytrPricing } from '@/lib/paytr.mjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const pricing = await getPaytrPricing();
    return Response.json(pricing, {
      headers: pricing.configured
        ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }
        : { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('[paytr-pricing]', {
      code: error?.code || 'PAYTR_RATE_UNAVAILABLE',
      paytrErrorNo: error?.paytrErrorNo || '',
      reason: error?.paytrReason || String(error?.message || '').slice(0, 240)
    });
    return Response.json(
      { error: 'kart_fiyati_alinamadi' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
