import '../env.js';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { getRequiredEnv } from '../env.js';

const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    role: string;
    roleId: number;
  };
}

interface TokenPayload {
  id: number;
  email: string;
  username: string;
  role: string;
  roleId: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function generateRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const existingTokens = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (existingTokens.length >= 5) {
    const tokensToDelete = existingTokens.slice(4).map((refreshToken) => refreshToken.id);
    await prisma.refreshToken.deleteMany({
      where: { id: { in: tokensToDelete } },
    });
  }

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { include: { role: true } } },
  });

  if (!stored) throw new UnauthorizedError('Invalid refresh token');
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new UnauthorizedError('Refresh token expired');
  }
  if (stored.user.status !== 'active') {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new UnauthorizedError('User session is no longer active');
  }

  return stored;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function revokeAllUserTokens(userId: number): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of: ${roles.join(', ')}`);
    }
    next();
  };
}
