import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  updateUserStatusSchema,
  createRoleSchema,
  createUserSchema,
  updateUserSchema,
} from '../utils/validation.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';
import { paramToInt } from '../utils/params.js';
import { ConflictError } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

router.get('/users', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, search } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search as string } },
        { email: { contains: search as string } },
        { username: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: { select: { name: true } } },
        omit: { passwordHash: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(users, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

router.post('/users', requireRole('Administrator'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (existing) {
      throw new ConflictError('Email or username already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        passwordHash,
        department: data.department as any,
        roleId: data.roleId,
        status: data.status,
      },
      include: { role: { select: { name: true } } },
      omit: { passwordHash: true },
    });

    logger.info(`User ${user.username} created by ${req.user!.username}`);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateUserStatusSchema.parse(req.body);
    const updateData: any = { status: data.status };
    if (data.roleId) updateData.roleId = data.roleId;

    const user = await prisma.user.update({
      where: { id: paramToInt(req.params.id) },
      data: updateData,
      omit: { passwordHash: true },
    });

    logger.info(`User ${user.username} status -> ${data.status} by ${req.user!.username}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', requireRole('Administrator'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const updateData: any = {
      fullName: data.fullName,
      email: data.email,
      department: data.department as any,
      roleId: data.roleId,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: paramToInt(req.params.id) },
      data: updateData,
      omit: { passwordHash: true },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/roles', requireRole('Administrator', 'Manager'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { id: 'asc' },
    });
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

router.post('/roles', requireRole('Administrator'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoleSchema.parse(req.body);
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
      },
    });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

router.put('/roles/:id', requireRole('Administrator'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoleSchema.parse(req.body);
    const role = await prisma.role.update({
      where: { id: paramToInt(req.params.id) },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
      },
    });
    res.json(role);
  } catch (error) {
    next(error);
  }
});

router.get('/audit-log', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    res.json(paginatedResponse(logs, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

export default router;
