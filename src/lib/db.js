import { PrismaClient } from '@prisma/client';

// Next.js dev hot-reload'da çoklu client açılmasın
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;
