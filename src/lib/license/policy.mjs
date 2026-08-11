export const LICENSE_ROLES = Object.freeze(['sahip', 'lisans_yoneticisi', 'destek', 'denetci']);
export const LICENSE_ACTIONS = Object.freeze([
  'siparis.listele',
  'siparis.eft_onayla',
  'siparis.kalici_sil',
  'indirme.davet_gonder',
  'paytr.bildirim_gonder',
  'posta.goruntule',
  'posta.duzenle',
  'posta.gonder',
  'yonetim.masaustu_bagla',
  'lisans.esitle',
  'lisans.listele',
  'lisans.gecmis',
  'lisans.askiya_al',
  'lisans.etkinlestir',
  'lisans.cihaz_transferi',
  'lisans.yetki_azalt',
  'lisans.yaptirim_modu',
  'lisans.yeni_imzala',
  'lisans.kalici_iptal',
  'yonetim.kullanici_yonet',
  'anahtar.dondur'
]);

export const LICENSE_ROLE_ACTIONS = Object.freeze({
  sahip: new Set(LICENSE_ACTIONS),
  lisans_yoneticisi: new Set([
    'siparis.listele', 'siparis.eft_onayla', 'indirme.davet_gonder', 'paytr.bildirim_gonder', 'yonetim.masaustu_bagla', 'lisans.esitle',
    'lisans.listele', 'lisans.gecmis', 'lisans.askiya_al', 'lisans.etkinlestir',
    'lisans.cihaz_transferi', 'lisans.yetki_azalt', 'lisans.yeni_imzala'
  ]),
  destek: new Set(['lisans.listele', 'lisans.gecmis', 'lisans.askiya_al', 'lisans.etkinlestir']),
  denetci: new Set(['lisans.listele', 'lisans.gecmis'])
});

const MFA_ROLES = new Set(['sahip', 'lisans_yoneticisi']);
const REAUTH_ACTIONS = new Set(['siparis.eft_onayla', 'siparis.kalici_sil', 'indirme.davet_gonder', 'paytr.bildirim_gonder', 'lisans.esitle', 'lisans.kalici_iptal', 'lisans.yaptirim_modu', 'yonetim.kullanici_yonet', 'anahtar.dondur']);
const REASON_ACTIONS = new Set([
  'siparis.eft_onayla', 'siparis.kalici_sil', 'indirme.davet_gonder', 'paytr.bildirim_gonder', 'lisans.esitle', 'lisans.askiya_al', 'lisans.cihaz_transferi', 'lisans.yetki_azalt', 'lisans.yaptirim_modu', 'lisans.kalici_iptal'
]);

function deny(reason) { return { allowed: false, reason }; }

export function licenseAuthorizationDecision(input) {
  const q = input && typeof input === 'object' ? input : {};
  if (!LICENSE_ROLES.includes(q.role)) return deny('rol-taninmiyor');
  if (!LICENSE_ACTIONS.includes(q.action)) return deny('islem-taninmiyor');
  if (!q.sessionValid) return deny('oturum-gecersiz');
  if (MFA_ROLES.has(q.role) && !q.mfaVerified) return deny('mfa-gerekli');
  if (!LICENSE_ROLE_ACTIONS[q.role].has(q.action)) return deny('rol-yetkisiz');
  if (REASON_ACTIONS.has(q.action) && !String(q.reason || '').trim()) return deny('gerekce-gerekli');
  if (q.role === 'destek' && q.action === 'lisans.askiya_al') {
    const days = Number(q.suspensionDays);
    if (!Number.isInteger(days) || days < 1 || days > 7) return deny('destek-en-fazla-7-gun');
  }
  if (REAUTH_ACTIONS.has(q.action) && !q.reauthenticated) return deny('yeniden-dogrulama-gerekli');
  if (q.action === 'lisans.kalici_iptal') {
    if (!q.licenseNo || String(q.licenseNoConfirmation || '') !== String(q.licenseNo)) {
      return deny('lisans-no-onayi-gerekli');
    }
  }
  return { allowed: true, reason: 'izinli' };
}
