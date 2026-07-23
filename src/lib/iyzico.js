// iyzico ödeme sarmalayıcı — resmi 'iyzipay' SDK'sı (callback tabanlı) promise'e sarılır.
// Env: IYZICO_API_KEY, IYZICO_SECRET, IYZICO_URI (sandbox: https://sandbox-api.iyzipay.com,
//      canlı: https://api.iyzipay.com). Anahtar yoksa iyzicoConfigured()=false → uçlar 503 döner.
// Akış: CheckoutForm (iyzico'nun barındırdığı ödeme sayfası) → initialize ile paymentPageUrl al →
//       kullanıcı orada öder → iyzico callbackUrl'e token POST'lar → retrieve ile sonucu doğrula.
// KURULUM: `npm i iyzipay` (package.json'a eklendi). Alanlar iyzico dökümanına göre doğrulanmalı.
import IyzipayPkg from 'iyzipay';
import { SITE } from './site';

// iyzipay CommonJS paketi — Next.js ESM interop'unda bazen { default } içine sarılır.
const Iyzipay = IyzipayPkg?.default || IyzipayPkg;

const API_KEY = process.env.IYZICO_API_KEY || '';
const SECRET = process.env.IYZICO_SECRET || '';
const URI = process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com';

export function iyzicoConfigured() {
  return !!(API_KEY && SECRET);
}

function client() {
  if (!iyzicoConfigured()) throw new Error('iyzico anahtarları yok (IYZICO_API_KEY / IYZICO_SECRET).');
  return new Iyzipay({ apiKey: API_KEY, secretKey: SECRET, uri: URI });
}

// price iyzico'da string ve ondalıklı olmalı: 3000 → "3000.0"
function money(n) {
  return (Number(n) || 0).toFixed(1);
}

// Ödeme sayfası başlat. order (DB kaydı) + buyer{name,email,gsm?,identity?,address?,city?} + ip alır.
// Başarılıysa { status:'success', token, paymentPageUrl, ... } döner.
export async function checkoutFormInitialize({ order, buyer, ip }) {
  const iyz = client();
  const priceStr = money(order.price);
  const parts = (buyer.name || 'Müşteri').trim().split(/\s+/);
  const ad = parts[0] || 'Müşteri';
  const soyad = parts.slice(1).join(' ') || ad;
  const addr = buyer.address || 'Türkiye';
  const city = buyer.city || 'İstanbul';

  const req = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: order.id, // callback'te order'ı buradan bulacağız
    price: priceStr,
    paidPrice: priceStr,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: order.id,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: SITE + '/api/pay/iyzico/callback',
    enabledInstallments: [1, 2, 3, 6], // taksit seçenekleri — istenirse [1]
    buyer: {
      id: buyer.email,
      name: ad,
      surname: soyad,
      gsmNumber: buyer.gsm || '+905000000000',
      email: buyer.email,
      identityNumber: buyer.identity || '11111111111', // iyzico zorunlu; ön siparişte placeholder
      registrationAddress: addr,
      ip: ip || '85.34.78.112',
      city,
      country: 'Türkiye'
    },
    shippingAddress: { contactName: buyer.name || 'Müşteri', city, country: 'Türkiye', address: addr },
    billingAddress: { contactName: buyer.name || 'Müşteri', city, country: 'Türkiye', address: addr },
    basketItems: [
      {
        id: order.product || 'hermes',
        name: order.product || 'Hermes Astroloji',
        category1: 'Yazılım',
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL, // dijital ürün
        price: priceStr
      }
    ]
  };

  return new Promise((resolve, reject) => {
    iyz.checkoutFormInitialize.create(req, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

// Callback'te gelen token ile ödeme sonucunu doğrula. { paymentStatus:'SUCCESS', status, paymentId, conversationId, ... }
export async function checkoutFormRetrieve(token) {
  const iyz = client();
  return new Promise((resolve, reject) => {
    iyz.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });
}
