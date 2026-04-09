import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const saveRefreshToken = (
  userId: string,
  tokenHash: string,
  family: string,
  expiresAt: Date,
) => {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, family, expiresAt },
  });
};

export const findRefreshToken = (tokenHash: string) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
};

export const listActiveRefreshTokens = () => {
  return prisma.refreshToken.findMany({
    where: {
      revokedAt: null,
    },
    include: { user: true },
  });
};

export const revokeRefreshToken = (id: string) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
};

export const revokeFamily = (family: string) => {
  return prisma.refreshToken.updateMany({
    where: { family, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllForUser = (userId: string) => {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const updatePassword = (userId: string, passwordHash: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

export const createAuditLog = (data: Prisma.AuditLogUncheckedCreateInput) => {
  return prisma.auditLog.create({ data });
};
