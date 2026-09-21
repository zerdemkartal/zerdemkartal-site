// Kalıcı iptal edilmiş tek lisansın sahipçe verilen geçici erişim kararı,
// genel izleme pilotundan bağımsızdır. Lisansın terminal iptal durumu değişmez;
// yalnız kurulu uygulamaya gönderilen erişim kararı açılıp kapatılır.
export function canChangeMonitoringOnly(license, nextMonitoringOnly) {
  if (!license || license.monitoringOnly === nextMonitoringOnly) return false;
  return true;
}

export function effectiveEnforcement({ license, observedStatus, enforcementEnabled }) {
  const terminalBlock = license.status === 'iptal' && license.monitoringOnly === false;
  const monitoring = !terminalBlock && (!enforcementEnabled || license.monitoringOnly !== false);
  return {
    monitoring,
    effectiveStatus: terminalBlock ? 'iptal' : monitoring ? 'aktif' : observedStatus
  };
}
