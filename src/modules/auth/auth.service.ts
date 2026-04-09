import type { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyToken,
} from '../../shared/utils/crypto.js';
import {
  createAuditLog,
  findUserByEmail,
  findUserById,
  listActiveRefreshTokens,
  listRevokedRefreshTokens,
  revokeAllForUser,
  revokeFamily,
  revokeRefreshToken,
  saveRefreshToken,
  updatePassword,
} from './auth.repository.js';

type AuthContext = { ip?: string | undefined; userAgent?: string | undefined };

const normalizePem = (value: string): string => value.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

const signAccessToken = (payload: { sub: string; email: string; role: Role }): string => {
  const privateKey = normalizePem(env.JWT_PRIVATE_KEY);
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_TTL,
  } as jwt.SignOptions);
};

const refreshExpiresAt = (): Date => {
  const ttlMs = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ttlMs);
};

const writeAudit = async (
  userId: string | null,
  action: string,
  entityId: string | undefined,
  ctx: AuthContext,
): Promise<void> => {
  await createAuditLog({
    userId: userId ?? null,
    action,
    entity: 'AUTH',
    entityId: entityId ?? null,
    ipAddress: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });
};

export const login = async (email: string, password: string, ip?: string, userAgent?: string) => {
  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    await writeAudit(user?.id ?? null, 'LOGIN_FAILED', user?.id, { ip, userAgent });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isValid = await verifyPassword(user.passwordHash, password);

  if (!isValid) {
    await writeAudit(user.id, 'LOGIN_FAILED', user.id, { ip, userAgent });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const family = uuidv4();

  await saveRefreshToken(user.id, refreshTokenHash, family, refreshExpiresAt());
  await writeAudit(user.id, 'LOGIN_SUCCESS', user.id, { ip, userAgent });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const refresh = async (rawToken: string, ip?: string, userAgent?: string) => {
  // First check revoked tokens — reuse of a revoked token means theft; revoke entire family
  const revokedTokens = await listRevokedRefreshTokens();
  for (const revokedRecord of revokedTokens) {
    const isReused = await verifyToken(revokedRecord.tokenHash, rawToken);
    if (isReused) {
      await revokeFamily(revokedRecord.family);
      await writeAudit(revokedRecord.userId, 'REFRESH_TOKEN_REUSE_DETECTED', revokedRecord.id, { ip, userAgent });
      throw new AppError(401, 'TOKEN_REUSE_DETECTED', 'Refresh token reuse detected — all sessions revoked');
    }
  }

  const activeTokens = await listActiveRefreshTokens();

  let matched: (typeof activeTokens)[number] | null = null;

  for (const tokenRecord of activeTokens) {
    const matches = await verifyToken(tokenRecord.tokenHash, rawToken);
    if (matches) {
      matched = tokenRecord;
      break;
    }
  }

  if (!matched) {
    await writeAudit(null, 'REFRESH_TOKEN_NOT_FOUND', undefined, { ip, userAgent });
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  if (matched.expiresAt.getTime() <= Date.now()) {
    await revokeFamily(matched.family);
    await writeAudit(matched.userId, 'REFRESH_EXPIRED_FAMILY_REVOKED', matched.id, { ip, userAgent });
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token expired');
  }

  await revokeRefreshToken(matched.id);

  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = await hashToken(newRefreshToken);

  await saveRefreshToken(matched.userId, newRefreshTokenHash, matched.family, refreshExpiresAt());

  const accessToken = signAccessToken({
    sub: matched.user.id,
    email: matched.user.email,
    role: matched.user.role,
  });

  await writeAudit(matched.userId, 'REFRESH_SUCCESS', matched.id, { ip, userAgent });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (rawToken: string, userId: string, ip?: string, userAgent?: string): Promise<void> => {
  const activeTokens = await listActiveRefreshTokens();

  for (const tokenRecord of activeTokens) {
    if (tokenRecord.userId !== userId) {
      continue;
    }

    const matches = await verifyToken(tokenRecord.tokenHash, rawToken);
    if (matches) {
      await revokeFamily(tokenRecord.family);
      await writeAudit(userId, 'LOGOUT', tokenRecord.id, { ip, userAgent });
      return;
    }
  }

  throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  ip?: string,
  userAgent?: string,
): Promise<void> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const validCurrentPassword = await verifyPassword(user.passwordHash, currentPassword);

  if (!validCurrentPassword) {
    throw new AppError(401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await updatePassword(userId, newPasswordHash);
  await revokeAllForUser(userId);
  await writeAudit(userId, 'PASSWORD_CHANGED', userId, { ip, userAgent });
};
