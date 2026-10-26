import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbPath = path.resolve(process.cwd(), 'db/custom.db');

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || `file:${dbPath}`,
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
