import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { createEventReservationSchema, createEventPackageSchema } from '../utils/validation.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';
import { paramToInt } from '../utils/params.js';

const router = Router();
router.use(authMiddleware);

const eventRoles = ['Administrator', 'Manager', 'Front Office'];

router.get('/reservations', requireRole(...eventRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, type } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.eventType = type;

    const [events, total] = await Promise.all([
      prisma.eventReservation.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          package: { select: { name: true } },
        },
        orderBy: { eventDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventReservation.count({ where }),
    ]);
    res.json(paginatedResponse(events, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

router.post('/reservations', requireRole(...eventRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createEventReservationSchema.parse(req.body);
    const refNumber = `EVT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    const event = await prisma.eventReservation.create({
      data: {
        reservationRef: refNumber,
        eventType: data.eventType as any,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        venueId: data.venueId,
        packageId: data.packageId,
        eventDate: new Date(data.eventDate),
        guestCount: data.guestCount,
        setupStyle: data.setupStyle,
        foodOptions: data.foodOptions || [],
        decorationNotes: data.decorationNotes,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes,
        createdBy: req.user!.id,
      },
    });

    logger.info(`Event reservation created: ${refNumber}`);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

router.patch('/reservations/:id/status', requireRole(...eventRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const event = await prisma.eventReservation.update({
      where: { id: paramToInt(req.params.id) },
      data: { status },
    });
    res.json(event);
  } catch (error) {
    next(error);
  }
});

router.get('/packages', requireRole(...eventRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = category;

    const packages = await prisma.eventPackage.findMany({
      where,
      orderBy: { pricePerPerson: 'asc' },
    });
    res.json(packages);
  } catch (error) {
    next(error);
  }
});

router.post('/packages', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createEventPackageSchema.parse(req.body);
    const eventPackage = await prisma.eventPackage.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category as any,
        pricePerPerson: data.pricePerPerson,
        minGuests: data.minGuests,
        maxGuests: data.maxGuests,
        features: data.features || [],
        foodOptions: data.foodOptions || [],
      },
    });
    res.status(201).json(eventPackage);
  } catch (error) {
    next(error);
  }
});

router.get('/venues', requireRole(...eventRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const venues = await prisma.eventVenue.findMany({
      where: { isActive: true },
      orderBy: { capacity: 'asc' },
    });
    res.json(venues);
  } catch (error) {
    next(error);
  }
});

router.get('/day-out-plans', requireRole(...eventRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.dayOutPlan.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

router.post('/day-out-plans', requireRole('Administrator', 'Manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, pricePerPerson, durationHours, maxParticipants, inclusions, itinerary } = req.body;
    const plan = await prisma.dayOutPlan.create({
      data: {
        name,
        description,
        category: category as any,
        pricePerPerson,
        durationHours: durationHours || 8,
        maxParticipants: maxParticipants || 20,
        inclusions: inclusions || [],
        itinerary: itinerary || [],
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

router.get('/calendar', requireRole(...eventRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await prisma.eventReservation.findMany({
      where: { eventDate: { gte: startDate, lte: endDate } },
      include: { venue: { select: { name: true } } },
      orderBy: [{ eventDate: 'asc' }],
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

export default router;
