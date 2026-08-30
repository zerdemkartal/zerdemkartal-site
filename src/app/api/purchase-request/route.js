import { z } from 'zod';
import { prisma } from '@/lib/db';
import { purchaseRequestNotificationEmail, salesNotificationRecipients } from '@/lib/email';
import { licensePriceFor } from '@/lib/licensePricing';
import { ingestPurchaseRequest } from '@/lib/mail';
import { invoiceValidationIssue, normalizeInvoiceData } from '@/lib/purchase-invoice.mjs';
import { PAYTR_TERMS_VERSION } from '@/lib/paytr.mjs';

export const runtime = 'nodejs';

const PurchaseRequest = z.object({
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
  termsAccepted: z.literal(true),
  termsVersion: z.literal(PAYTR_TERMS_VERSION)
}).strict();

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

export async function POST(request) {
  const parsed = PurchaseRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'satın_alma_ve_fatura_bilgileri_gecersiz' }, { status: 400 });
  }

  const invoice = normalizeInvoiceData(parsed.data);
  const issue = invoiceValidationIssue({ ...parsed.data, ...invoice });
  if (issue) {
    return Response.json({ error: 'fatura_bilgileri_gecersiz', field: issue.field }, { status: 400 });
  }

  const name = cleanName(parsed.data.adSoyad);
  const email = parsed.data.email.trim().toLowerCase();
  const deviceLimit = parsed.data.planId === 'hermes-2' ? 2 : 1;
  const price = licensePriceFor(deviceLimit);
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.lead.count({ where: { email, createdAt: { gte: since } } });
  if (recent >= 5) {
    return Response.json({ error: 'cok_fazla_istek' }, { status: 429 });
  }

  const result = await ingestPurchaseRequest({
    name,
    email,
    phone: invoice.phone,
    whatsappPhone: invoice.phone,
    deviceLimit,
    ...invoice
  });
  const notification = await purchaseRequestNotificationEmail({
    recipients: salesNotificationRecipients(),
    request: { name, email, deviceLimit, price, ...invoice },
    idempotencyKey: `eft-request-${result.lead.id}`
  });
  if (!notification.ok) {
    console.error('[purchase-request] yönetici bildirimi gönderilemedi', {
      leadId: result.lead.id,
      skipped: Boolean(notification.skipped),
      error: String(notification.error || 'bilinmeyen-hata').slice(0, 500)
    });
  }

  return Response.json({
    ok: true,
    id: result.lead.id,
    notificationSent: notification.ok === true,
    notificationError: notification.ok ? null : 'yonetici-bildirimi-gonderilemedi'
  }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
