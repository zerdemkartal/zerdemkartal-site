import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = String(process.env.LICENSE_OWNER_EMAIL || '').trim().toLowerCase();
const confirmation = String(process.env.LICENSE_OWNER_CONFIRM || '');

async function main() {
  if (!email || confirmation !== 'HERMES-LISANS-SAHIP') {
    throw new Error('LICENSE_OWNER_EMAIL ve LICENSE_OWNER_CONFIRM=HERMES-LISANS-SAHIP gerekli');
  }
  await prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.findUnique({ where: { email } });
    if (!user) throw new Error('Önce mevcut AdminUser hesabı oluşturulmalı');
    const roleChanges = !user.licenseActive || user.licenseRole !== 'sahip';
    await tx.adminUser.update({
      where: { id: user.id },
      data: {
        licenseActive: true,
        licenseRole: 'sahip',
        licenseRoleChangedAt: roleChanges ? new Date() : user.licenseRoleChangedAt,
        licenseAuthVersion: roleChanges ? { increment: 1 } : undefined
      }
    });
    if (roleChanges) {
      await tx.adminSession.updateMany({
        where: { adminId: user.id, revokedAt: null }, data: { revokedAt: new Date() }
      });
    }
  });
  console.log('Lisans sahibi hesabı hazırlandı.');
}

main().finally(() => prisma.$disconnect());
