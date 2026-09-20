// Kalıcı iptal edilmiş tek lisans için sahipçe verilen erişim kapatma kararı,
// genel izleme pilotundan bağımsızdır. Bu karar geri alınmaz; yeni erişim yeni
// bir imzalı lisansla verilir.
export function canChangeMonitoringOnly(license, nextMonitoringOnly) {
  if (!license || license.monitoringOnly === nextMonitoringOnly) return false;
  if (license.status === 'iptal') {
    return license.monitoringOnly === true && nextMonitoringOnly === false;
  }
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
