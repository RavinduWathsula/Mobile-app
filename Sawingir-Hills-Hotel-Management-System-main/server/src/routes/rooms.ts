import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { createRoomSchema, createRoomTypeSchema, updateRoomStatusSchema } from '../utils/validation.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { paramToInt } from '../utils/params.js';

const router = Router();
router.use(authMiddleware);

const roomReaders = ['Administrator', 'Manager', 'Front Office', 'Housekeeping'];
const roomEditors = ['Administrator', 'Manager', 'Front Office'];

function hasDateRange(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

router.get('/', requireRole(...roomReaders), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, floor, type, checkIn, checkOut, excludeBookingId } = req.query;

    const where: any = { isActive: true };
    if (status) where.status = status;
    if (floor) where.floor = parseInt(floor as string, 10);
    if (type) where.roomTypeId = parseInt(type as string, 10);

    if (hasDateRange(checkIn) && hasDateRange(checkOut)) {
      const excludedId = excludeBookingId ? parseInt(excludeBookingId as string, 10) : undefined;
      where.bookings = {
        none: {
          status: { in: ['confirmed', 'checked_in'] },
          ...(excludedId ? { id: { not: excludedId } } : {}),
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      };
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { roomType: { select: { name: true, basePrice: true, maxOccupancy: true } } },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.room.count({ where }),
    ]);

    res.json(paginatedResponse(rooms, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

router.get('/types', requireRole(...roomReaders), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const checkIn = req.query.checkIn;
    const checkOut = req.query.checkOut;

    const types = await prisma.roomType.findMany({
      where: { isActive: true },
      include: {
        rooms: {
          where: {
            isActive: true,
            status: { notIn: ['maintenance', 'out_of_order'] },
          },
          select: { id: true },
        },
      },
      orderBy: { basePrice: 'asc' },
    });

    if (hasDateRange(checkIn) && hasDateRange(checkOut)) {
      const overlappingBookings = await prisma.booking.groupBy({
        by: ['roomTypeId'],
        _count: { roomTypeId: true },
        where: {
          status: { in: ['confirmed', 'checked_in'] },
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      });

      const reservedByType = new Map(overlappingBookings.map((booking) => [booking.roomTypeId, booking._count.roomTypeId]));
      res.json(types.map((type) => {
        const roomCount = type.rooms.length;
        const reservedRooms = reservedByType.get(type.id) || 0;

        return {
          ...type,
          totalRooms: roomCount,
          availableRooms: Math.max(roomCount - reservedRooms, 0),
        };
      }));
      return;
    }

    res.json(types.map((type) => ({
      ...type,
      totalRooms: type.rooms.length,
      availableRooms: type.rooms.length,
    })));
  } catch (error) {
    next(error);
  }
});

router.post('/types', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoomTypeSchema.parse(req.body);
    const type = await prisma.roomType.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        maxOccupancy: data.maxOccupancy,
        totalRooms: data.totalRooms || 0,
        amenities: data.amenities || [],
      },
    });
    res.status(201).json(type);
  } catch (error) {
    next(error);
  }
});

router.put('/types/:id', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoomTypeSchema.parse(req.body);
    const type = await prisma.roomType.update({
      where: { id: paramToInt(req.params.id) },
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        maxOccupancy: data.maxOccupancy,
        totalRooms: data.totalRooms || 0,
        amenities: data.amenities || [],
      },
    });
    res.json(type);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole(...roomEditors), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomTypeId: data.roomTypeId,
        floor: data.floor,
        features: data.features || [],
        notes: data.notes,
      },
      include: { roomType: { select: { name: true, basePrice: true } } },
    });
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole(...roomEditors), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await prisma.room.update({
      where: { id: paramToInt(req.params.id) },
      data: {
        roomNumber: data.roomNumber,
        roomTypeId: data.roomTypeId,
        floor: data.floor,
        features: data.features || [],
        notes: data.notes,
      },
    });
    res.json(room);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRole(...roomEditors), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = updateRoomStatusSchema.parse(req.body);
    const room = await prisma.room.update({
      where: { id: paramToInt(req.params.id) },
      data: { status: status as any },
    });
    res.json(room);
  } catch (error) {
    next(error);
  }
});

router.get('/rate-plans', requireRole(...roomReaders), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [plans, total] = await Promise.all([
      prisma.ratePlan.findMany({
        where: { isActive: true },
        include: { roomType: { select: { name: true } } },
        orderBy: [{ roomTypeId: 'asc' }, { mealPlan: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.ratePlan.count({ where: { isActive: true } }),
    ]);
    res.json(paginatedResponse(plans, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

export default router;
