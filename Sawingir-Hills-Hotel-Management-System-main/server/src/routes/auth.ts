import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  authMiddleware,
  AuthRequest,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../utils/validation.js';
import { UnauthorizedError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = Router();

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  };
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: username }, { username }] },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (user.status === 'pending') throw new ForbiddenError('Account pending approval');
    if (user.status === 'inactive') throw new ForbiddenError('Account deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
      roleId: user.roleId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user.id);

    logger.info(`User logged in: ${user.username}`);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role.name,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) throw new ConflictError('Email or username already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        passwordHash,
        department: (data.department as any) || 'FrontOffice',
        roleId: 3,
        status: 'pending',
      },
    });

    logger.info(`New registration: ${data.username} (pending approval)`);
    res.status(201).json({ message: 'Registration successful. Pending admin approval.' });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) throw new UnauthorizedError('Refresh token required');

    const stored = await verifyRefreshToken(refreshToken);
    const user = stored.user;

    await revokeRefreshToken(refreshToken);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
      roleId: user.roleId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const rotatedRefreshToken = await generateRefreshToken(user.id);
    setRefreshTokenCookie(res, rotatedRefreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role.name,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    clearRefreshTokenCookie(res);
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true },
      omit: { passwordHash: true },
    });

    if (!user) throw new NotFoundError('User');
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
