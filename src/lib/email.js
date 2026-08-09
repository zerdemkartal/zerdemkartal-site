// İşlemsel e-posta — Resend HTTP API (ek paket gerekmez, fetch ile).
// RESEND_API_KEY yoksa SESSİZ no-op: e-posta atlanır, log düşer, çağıran akış (ödeme/callback) ASLA kırılmaz.
// Env: RESEND_API_KEY, EMAIL_FROM (örn. "Hermes Astroloji <info@hermesastroloji.com>").
// NOT: EMAIL_FROM domaini Resend'de doğrulanmış olmalı; değilse Resend gönderimi reddeder.
import { SITE } from './site';

const FROM = process.env.EMAIL_FROM || 'Hermes <onboarding@resend.dev>';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// Düşük seviye gönderim. { ok:boolean, id?, skipped?, error? } döner — hata FIRLATMAZ.
export async function sendMail({ to, subject, html, text, replyTo, from, headers, tags, attachments }) {
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
        from: from || FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(headers && Object.keys(headers).length ? { headers } : {}),
        ...(Array.isArray(tags) && tags.length ? { tags } : {}),
        ...(Array.isArray(attachments) && attachments.length ? { attachments } : {})
      })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('[email] gönderilemedi', res.status, t);
      return { ok: false, error: t || String(res.status) };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data.id || null };
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
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#6b4fa0;color:#fff;text-decoration:none;border-radius:999px;padding:12px 24px;font-weight:600;font-size:15px">${escapeHtml(text)}</a>`;

// Ön sipariş alındı (ödeme entegrasyonu bağlanmadan da kullanılabilir — makbuz niyetine).
export async function orderReceivedEmail(order) {
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${escapeHtml(order.name)},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Hermes ön siparişini aldık. Ödeme adımı tamamlanınca kurulum dosyası ve lisans etkinleştirme adımların bu adrese iletilecek.</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 18px"><b>Ürün:</b> ${escapeHtml(order.product)} · <b>Tutar:</b> ₺${escapeHtml(order.price)} · <b>Sipariş no:</b> ${escapeHtml(order.id)}</p>
${btn(SITE + '/indir', 'İndirme sayfası')}`;
  return sendMail({ to: order.email, subject: 'Hermes ön siparişin alındı ☿', html: shell('Ön siparişin alındı', inner) });
}

function invitationExpiry(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul'
  }).format(new Date(value));
}

// Yönetim panelinden veya ödeme onayından üretilen kişisel indirme daveti.
// Geçici parola yalnız bu çağrının belleğinde bulunur; veri tabanında bcrypt özeti vardır.
export async function downloadInvitationEmail({ recipient, access, paymentConfirmed = false }) {
  const safeName = escapeHtml(recipient.name);
  const safeOrderId = recipient.id ? escapeHtml(recipient.id) : '';
  // Parça (#) sunucu günlüklerine ve yönlendiren başlığına gitmez; tarayıcıdaki
  // istemci bileşeni belirteci okuyup doğrulama isteğinin gövdesine taşır.
  const downloadUrl = `${SITE}/indir#d=${encodeURIComponent(access.linkToken)}`;
  const safePassword = escapeHtml(access.temporaryPassword);
  const safeExpiry = escapeHtml(invitationExpiry(access.passwordExpiresAt));
  const opening = paymentConfirmed
    ? 'Ödemen alındı, teşekkür ederiz. Hermes Windows kurulumuna kişisel bağlantın ve geçici şifrenle erişebilirsin.'
    : 'Hermes Windows kurulumuna kişisel bağlantın ve geçici şifrenle erişebilirsin.';
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${safeName},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">${opening}</p>
<div style="margin:0 0 18px;padding:16px 18px;border:1px solid #e8e3d6;border-radius:12px;background:#f4f1e8">
  <div style="font-size:12px;color:#6b675e;margin-bottom:7px">72 saatlik geçici indirme şifren</div>
  <div style="font-family:Consolas,'Courier New',monospace;font-size:19px;font-weight:700;letter-spacing:.06em;color:#241a12">${safePassword}</div>
  <div style="font-size:12px;color:#6b675e;margin-top:8px">Son kullanım: ${safeExpiry}</div>
</div>
${btn(downloadUrl, 'Kişisel indirme sayfasını aç')}
<ol style="font-size:15px;line-height:1.8;color:#3a2d20;margin:0 0 18px;padding-left:20px">
<li>Bağlantıyı aç ve yukarıdaki geçici şifreyi gir.</li>
<li>Hermes’i indir ve Windows kurulumunu tamamla.</li>
<li>Program açıldığında <b>Lisans İste</b> bölümüne ad, soyad ve e-posta bilgilerini yaz.</li>
<li>Makine kimliğin doğrudan lisans yöneticisine ulaşır; imzalı lisans anahtarın ayrıca e-postayla gönderilir.</li>
</ol>
<p style="font-size:13px;line-height:1.7;color:#6b675e;margin:0 0 18px">Bu şifre yalnız kurulum dosyasını açar; Hermes lisansının yerine geçmez. Kullanım hakkın, sana ayrıca gönderilecek imzalı lisans anahtarıyla etkinleşir.</p>
${safeOrderId ? `<p style="font-size:12.5px;line-height:1.7;color:#6b675e;margin:18px 0 0"><b>Sipariş no:</b> ${safeOrderId}${Number.isFinite(recipient.price) ? ` · <b>Tutar:</b> ₺${escapeHtml(recipient.price)}` : ''}</p>` : ''}`;
  const text = [
    `Merhaba ${recipient.name},`,
    paymentConfirmed ? 'Ödemen alındı, teşekkür ederiz.' : 'Hermes indirme erişimin hazır.',
    `Kişisel indirme bağlantın: ${downloadUrl}`,
    `72 saatlik geçici şifren: ${access.temporaryPassword}`,
    `Son kullanım: ${invitationExpiry(access.passwordExpiresAt)}`,
    'Program açıldığında Lisans İste bölümüne ad, soyad ve e-posta bilgilerini yaz. İmzalı lisans anahtarın ayrıca e-postayla gönderilecek.',
    recipient.id ? `Sipariş no: ${recipient.id}` : ''
  ].filter(Boolean).join('\n\n');
  return sendMail({
    to: recipient.email,
    subject: paymentConfirmed ? 'Ödemen alındı — Hermes indirme erişimin hazır' : 'Hermes indirme erişimin hazır',
    html: shell('Hermes indirme erişimin hazır', inner),
    text,
    tags: [{ name: 'type', value: paymentConfirmed ? 'payment-confirmed' : 'download-invite' }]
  });
}

export async function paymentConfirmedEmail(order, access) {
  return downloadInvitationEmail({ recipient: order, access, paymentConfirmed: true });
}

// Lisans teslimi (geliştirici imzaladıktan sonra — istenirse MCP/panelden tetiklenir).
export async function licenseDeliveryEmail(order, licenseText) {
  const inner = `
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Merhaba ${escapeHtml(order.name)},</p>
<p style="font-size:15px;line-height:1.7;color:#3a2d20;margin:0 0 14px">Lisans anahtarın hazır. Programda <b>Lisansı Etkinleştir</b> alanına aşağıdaki metni yapıştır:</p>
<pre style="font-size:12.5px;background:#f4f1e8;border:1px solid #e8e3d6;border-radius:10px;padding:14px;white-space:pre-wrap;word-break:break-all;color:#241a12">${escapeHtml(licenseText)}</pre>
<p style="font-size:14px;line-height:1.7;color:#6b675e;margin:14px 0 0">Sorun olursa bu e-postayı yanıtla.</p>`;
  return sendMail({ to: order.email, subject: 'Hermes lisans anahtarın', html: shell('Lisansın hazır', inner) });
}
