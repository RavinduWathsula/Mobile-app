import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { createHousekeepingTaskSchema, updateTaskStatusSchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { paramToInt } from '../utils/params.js';

const router = Router();
router.use(authMiddleware);

const housekeepingRoles = ['Administrator', 'Manager', 'Housekeeping'];

router.get('/', requireRole(...housekeepingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      scheduledDate: { gte: targetDate, lt: nextDay },
    };
    if (status) where.status = status;

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: {
        room: {
          select: { roomNumber: true, roomType: { select: { name: true } } },
        },
        assignee: { select: { fullName: true } },
      },
      orderBy: [{ priority: 'asc' }, { room: { roomNumber: 'asc' } }],
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole(...housekeepingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createHousekeepingTaskSchema.parse(req.body);
    const task = await prisma.housekeepingTask.create({
      data: {
        roomId: data.roomId,
        taskType: data.taskType as any,
        priority: data.priority as any,
        assignedTo: data.assignedTo,
        notes: data.notes,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : new Date(),
      },
      include: {
        room: { select: { roomNumber: true } },
        assignee: { select: { fullName: true } },
      },
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRole(...housekeepingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = updateTaskStatusSchema.parse(req.body);
    const taskId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = { status };
      if (status === 'in_progress') updateData.startedAt = new Date();
      if (status === 'completed') updateData.completedAt = new Date();

      const task = await tx.housekeepingTask.update({
        where: { id: taskId },
        data: updateData,
      });

      if (status === 'completed' && task.taskType === 'cleaning') {
        await tx.room.update({
          where: { id: task.roomId },
          data: { status: 'available' },
        });
        logger.info(`Room ${task.roomId} cleaned -> available`);
      }

      return task;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/room-board', requireRole(...housekeepingRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        roomType: { select: { name: true } },
        housekeepingTasks: {
          where: {
            scheduledDate: { gte: today, lt: tomorrow },
            status: { not: 'completed' },
          },
          include: { assignee: { select: { fullName: true } } },
          take: 1,
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

export default router;
