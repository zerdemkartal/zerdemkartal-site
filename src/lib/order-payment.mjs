// Ödeme kaydını müşteri hesabı veya makine kimliği üretmeden günceller.
// Çağıran akış ayrıca kısa ömürlü indirme daveti gönderir; ürünü kullanma
// hakkını yine çevrimdışı Ed25519 lisans anahtarı belirler.
export async function preparePaidOrder({ database, orderId, payProvider, payRef, now = new Date() }) {
  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`paid-order:${orderId}`}))`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('siparis-bulunamadi');
    if (order.status === 'cancelled') throw new Error('iptal-edilmis-siparis');

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: order.status === 'delivered' ? 'delivered' : 'paid',
        payProvider: payProvider || order.payProvider,
        payRef: payRef || order.payRef,
        paidAt: order.paidAt || now
      }
    });
    return { order: updated, shouldSendEmail: !order.paymentEmailSentAt };
  }, { timeout: 15000 });
}

export async function markPaymentEmailSent({ database, orderId, now = new Date() }) {
  return database.order.update({
    where: { id: orderId },
    data: { paymentEmailSentAt: now }
  });
}
