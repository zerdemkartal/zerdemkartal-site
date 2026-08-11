export async function resolvePreviousLicense(database, {
  requestedLicenseNo,
  deviceHash,
  application
}) {
  if (!requestedLicenseNo) {
    return { license: null, matchedBy: 'none', requestedLicenseNo: null };
  }

  const exact = await database.license.findUnique({
    where: { licenseNo: requestedLicenseNo },
    include: { devices: true }
  });
  if (exact) {
    return { license: exact, matchedBy: 'license-no', requestedLicenseNo };
  }

  const activeDeviceRows = await database.licenseDevice.findMany({
    where: {
      deviceHash,
      active: true,
      license: {
        application,
        status: { not: 'iptal' }
      }
    },
    select: { licenseId: true },
    take: 2
  });
  const candidateIds = [...new Set(activeDeviceRows.map((row) => row.licenseId))];
  if (candidateIds.length !== 1) {
    return { license: null, matchedBy: candidateIds.length ? 'ambiguous-device' : 'missing', requestedLicenseNo };
  }

  const byDevice = await database.license.findUnique({
    where: { id: candidateIds[0] },
    include: { devices: true }
  });
  return {
    license: byDevice,
    matchedBy: byDevice ? 'device' : 'missing',
    requestedLicenseNo
  };
}
