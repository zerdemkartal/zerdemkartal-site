'use client';

import { useEffect, useState } from 'react';

const para = (value) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', minimumFractionDigits: 2
}).format(value);

export default function PaytrCardPrice() {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/pay/paytr/pricing', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setPricing(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!pricing?.configured) {
    return <span>Kartlı ödeme fiyatı PayTR bağlantısı etkinleştiğinde burada görünür.</span>;
  }

  const one = pricing.plans?.find((plan) => plan.planId === 'hermes-1');
  const two = pricing.plans?.find((plan) => plan.planId === 'hermes-2');
  return (
    <>
      <strong>Kartla tek çekim (1 cihaz): {para(one.cardPrice)}</strong>
      <span>Kartla tek çekim (2 cihaz): <b>{para(two.cardPrice)}</b></span>
      <span>Taksitli toplam, PayTR ekranında kart ve vade seçimine göre güncellenir.</span>
    </>
  );
}
