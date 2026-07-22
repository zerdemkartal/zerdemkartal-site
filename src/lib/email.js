// İşlemsel e-posta — Resend HTTP API (ek paket gerekmez, fetch ile).
// RESEND_API_KEY yoksa SESSİZ no-op: e-posta atlanır, log düşer, çağıran akış (ödeme/callback) ASLA kırılmaz.
// Env: RESEND_API_KEY, EMAIL_FROM (örn. "Hermes <siparis@hermesastroloji.com>").
// NOT: EMAIL_FROM domaini Resend'de doğrulanmış olmalı; değilse Resend gönderimi reddeder.
import { SITE } from './site';

const FROM = process.env.EMAIL_FROM || 'Hermes <onboarding@resend.dev>';

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// Düşük seviye gönderim. { ok:boolean, skipped?, error? } döner — hata FIRLATMAZ.
export async function sendMail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] RESEND_API_KEY yok — e-posta atlandı:', subject);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {})
      })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('[email] gönderilemedi', res.status, t);
      return { ok: false, error: t || String(res.status) };
    }
    return { ok: true };
  } catch (e) {
    console.error('[email] hata', e);
    return { ok: false, error: String(e) };
  }
}

// ————— Şablonlar (marka: Hermes, sıcak/sade) —————
function shell(title, inner) {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f3efe6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#241a12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbfaf7;border:1px solid #e8e3d6;border-radius:18px;overflow:hidden">
<tr><td style="padding:26px 30px 8px"><div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#6b4fa0">Hermes</div></td></tr>
<tr><td style="padding:4px 30px 30px">
<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:24px;line-height:1.2;margin:8px 0 14px;color:#241a12">${title}</h1>
${inner}
</td></tr>
<tr><td style="padding:18px 30px;border-top:1px solid #e8e3d6;font-size:12.5px;color:#6b675e">
Hermes Astroloji · <a href="${SITE}" style="color:#6b4fa0;text-decoration:none">hermesastroloji.com</a><br>
Bu e-postayı Hermes ön siparişi/işlemi nedeniyle aldın.
</td></tr>
</table></td></tr></table></body></html>`;
}

const btn = (href, text) =>
  `<a href="${href}" style="display:inline-block;background:#6b4fa0;color:#fff;text-decoration:none;border-radius:999px;padding:12px 24px;font-weight:600;font-size:15px">${text}</a>`;

// Ön sipariş alındı (ödeme entegrasyonu bağlanmadan da kullanılabilir — makbuz niyetine).
export async function orderReceivedEmail(order) {
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${order.name},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Hermes ön siparişini aldık. Ödeme adımı tamamlanınca kurulum dosyası ve lisans etkinleştirme adımların bu adrese iletilecek.</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 18px"><b>Ürün:</b> ${order.product} · <b>Tutar:</b> ₺${order.price} · <b>Sipariş no:</b> ${order.id}</p>
${btn(SITE + '/indir', 'İndirme sayfası')}`;
  return sendMail({ to: order.email, subject: 'Hermes ön siparişin alındı ☿', html: shell('Ön siparişin alındı', inner) });
}

// Ödeme onaylandı (iyzico callback SUCCESS) — kurulum + "Lisans İste" yönlendirmesi.
export async function paymentConfirmedEmail(order) {
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${order.name},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Ödemen alındı — teşekkürler. Hermes artık senin. Kurulum için:</p>
<ol style="font-size:15px;line-height:1.8;color:#3a2d20;margin:0 0 18px;padding-left:20px">
<li>Aşağıdaki bağlantıdan Hermes'i indir ve kur.</li>
<li>Program içinde <b>Lisans İste</b>'ye bas — makine kimliğin bize güvenli iletilir.</li>
<li>Lisansın imzalanıp bu adrese e-postayla gönderilir; programa yapıştırıp etkinleştirirsin.</li>
</ol>
<p style="font-size:14px;line-height:1.7;color:#6b675e;margin:0 0 18px"><b>Sipariş no:</b> ${order.id} · <b>Tutar:</b> ₺${order.price}</p>
${btn(SITE + '/indir', 'Hermes\'i indir')}`;
  return sendMail({ to: order.email, subject: 'Ödemen alındı — Hermes kurulum adımların', html: shell('Ödemen alındı ☿', inner) });
}

// Lisans teslimi (geliştirici imzaladıktan sonra — istenirse MCP/panelden tetiklenir).
export async function licenseDeliveryEmail(order, licenseText) {
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${order.name},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Lisans anahtarın hazır. Programda <b>Lisansı Etkinleştir</b> alanına aşağıdaki metni yapıştır:</p>
<pre style="font-size:12.5px;background:#f4f1e8;border:1px solid #e8e3d6;border-radius:10px;padding:14px;white-space:pre-wrap;word-break:break-all;color:#241a12">${licenseText}</pre>
<p style="font-size:14px;line-height:1.7;color:#6b675e;margin:14px 0 0">Sorun olursa bu e-postayı yanıtla.</p>`;
  return sendMail({ to: order.email, subject: 'Hermes lisans anahtarın', html: shell('Lisansın hazır', inner) });
}
