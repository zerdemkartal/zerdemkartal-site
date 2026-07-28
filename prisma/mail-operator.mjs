import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const email = String(process.env.MAIL_OPERATOR_EMAIL || '').trim().toLowerCase();
const password = String(process.env.MAIL_OPERATOR_PASSWORD || '');

if (!email || !email.includes('@')) throw new Error('MAIL_OPERATOR_EMAIL geçerli bir e-posta olmalıdır.');
if (password.length < 14) throw new Error('MAIL_OPERATOR_PASSWORD en az 14 karakter olmalıdır.');

const prisma = new PrismaClient();
try {
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing?.role === 'admin') {
    throw new Error('Bu e-posta ana yönetici hesabına ait; posta rolüne çevrilmedi.');
  }
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passHash: await bcrypt.hash(password, 12), role: 'mail_operator' },
    update: { passHash: await bcrypt.hash(password, 12), role: 'mail_operator' }
  });
  console.log(`Posta yetkilisi hazır: ${email}`);
} finally {
  await prisma.$disconnect();
}
