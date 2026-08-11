import { prisma } from '@/lib/db';
import { z } from 'zod';
import { invoiceValidationIssue, normalizeInvoiceData } from '@/lib/purchase-invoice.mjs';
import {
  PAYTR_LINK_TTL_MS,
  PAYTR_TERMS_VERSION,
  createPaytrCallbackId,
  createPaytrLink,
  getPaytrPricing
} from '@/lib/paytr.mjs';

export const runtime = 'nodejs';

const LinkRequest = z.object({
  planId: z.enum(['hermes-1', 'hermes-2']),
  adSoyad: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(10).max(24),
  invoiceType: z.enum(['individual', 'corporate']),
  companyTitle: z.string().trim().max(200),
  taxNumber: z.string().trim().min(10).max(11),
  taxOffice: z.string().trim().max(120),
  billingAddress: z.string().trim().min(10).max(500),
  billingDistrict: z.string().trim().min(2).max(120),
  billingCity: z.string().trim().min(2).max(120),
  requestId: z.string().uuid(),
  termsAccepted: z.literal(true),
  termsVersion: z.literal(PAYTR_TERMS_VERSION)
}).strict();

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

function sameRequest(checkout, request) {
  return checkout.planId === request.planId &&
    checkout.name === request.adSoyad &&
    checkout.email === request.email &&
    checkout.phone === request.phone &&
    checkout.invoiceType === request.invoiceType &&
    checkout.companyTitle === (request.companyTitle || null) &&
    checkout.taxNumber === request.taxNumber &&
    checkout.taxOffice === (request.taxOffice || null) &&
    checkout.billingAddress === request.billingAddress &&
    checkout.billingDistrict === request.billingDistrict &&
    checkout.billingCity === request.billingCity &&
    checkout.termsVersion === request.termsVersion;
}

function readyResponse(checkout, now = Date.now()) {
  if (
    checkout.status === 'link_ready' &&
    checkout.paymentPageUrl &&
    new Date(checkout.expiresAt).getTime() > now
  ) {
    return Response.json(
      { paymentPageUrl: checkout.paymentPageUrl, repeated: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return Response.json(
    { error: checkout.status === 'pending' ? 'odeme_baglantisi_hazirlaniyor' : 'odeme_istegi_suresi_doldu' },
    { status: 409, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request) {
  const parsed = LinkRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'secim_teslimat_ve_sozlesme_gecersiz' }, { status: 400 });
  }

  const input = {
    ...parsed.data,
    adSoyad: cleanName(parsed.data.adSoyad),
    email: cleanEmail(parsed.data.email),
    ...normalizeInvoiceData(parsed.data)
  };
  const invoiceIssue = invoiceValidationIssue(input);
  if (invoiceIssue) {
    return Response.json({ error: 'fatura_bilgileri_gecersiz', field: invoiceIssue.field }, { status: 400 });
  }
  const prior = await prisma.paytrCheckout.findUnique({ where: { requestId: input.requestId } });
  if (prior) {
    if (!sameRequest(prior, input)) {
      return Response.json({ error: 'odeme_istegi_eslesmedi' }, { status: 409 });
    }
    return readyResponse(prior);
  }

  let checkout = null;
  try {
    const pricing = await getPaytrPricing();
    if (!pricing.configured) {
      return Response.json({ error: 'kartli_odeme_yapilandirilmadi' }, { status: 503 });
    }
    const plan = pricing.plans.find((item) => item.planId === input.planId);
    if (!plan?.cardKurus) throw new Error('Plan fiyatı bulunamadı.');
    const callbackId = createPaytrCallbackId({
      deviceLimit: plan.deviceLimit,
      netKurus: Math.round(plan.eftPrice * 100),
      paymentKurus: plan.cardKurus
    });
    const now = new Date();
    checkout = await prisma.paytrCheckout.create({
      data: {
        requestId: input.requestId,
        callbackId,
        name: input.adSoyad,
        email: input.email,
        phone: input.phone,
        invoiceType: input.invoiceType,
        companyTitle: input.companyTitle || null,
        taxNumber: input.taxNumber,
        taxOffice: input.taxOffice || null,
        billingAddress: input.billingAddress,
        billingDistrict: input.billingDistrict,
        billingCity: input.billingCity,
        planId: plan.planId,
        termsVersion: pricing.termsVersion,
        deviceLimit: plan.deviceLimit,
        netTargetKurus: Math.round(plan.eftPrice * 100),
        paymentAmountKurus: plan.cardKurus,
        expiresAt: new Date(now.getTime() + PAYTR_LINK_TTL_MS)
      }
    });

    const result = await createPaytrLink({
      deviceLimit: plan.deviceLimit,
      paymentKurus: plan.cardKurus,
      callbackId
    });
    const ready = await prisma.paytrCheckout.update({
      where: { id: checkout.id },
      data: {
        status: 'link_ready',
        paymentPageUrl: result.paymentPageUrl,
        linkId: result.linkId || null
      }
    });
    return Response.json(
      { paymentPageUrl: ready.paymentPageUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error?.code === 'P2002') {
      const repeated = await prisma.paytrCheckout.findUnique({ where: { requestId: input.requestId } });
      if (repeated && sameRequest(repeated, input)) return readyResponse(repeated);
    }
    if (checkout?.id) {
      await prisma.paytrCheckout.delete({ where: { id: checkout.id } }).catch(() => {});
    }
    return Response.json(
      { error: 'odeme_baglantisi_olusturulamadi' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
