import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const hashOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, hashOptions);
};

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  return argon2.verify(hash, password);
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString('hex');
};

export const hashToken = async (token: string): Promise<string> => {
  return argon2.hash(token, hashOptions);
};

export const verifyToken = async (hash: string, token: string): Promise<boolean> => {
  return argon2.verify(hash, token);
};
