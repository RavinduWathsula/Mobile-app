import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const dashboardRoles = ['Administrator', 'Manager', 'Front Office'];
const reportRoles = ['Administrator', 'Manager', 'Front Office'];

router.get('/dashboard', requireRole(...dashboardRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalRooms, occupied, available, dirty, maint] = await Promise.all([
      prisma.room.count({ where: { isActive: true } }),
      prisma.room.count({ where: { isActive: true, status: 'occupied' } }),
      prisma.room.count({ where: { isActive: true, status: 'available' } }),
      prisma.room.count({ where: { isActive: true, status: 'dirty' } }),
      prisma.room.count({ where: { isActive: true, status: 'maintenance' } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [arrivals, checkouts, pendingPayments] = await Promise.all([
      prisma.booking.count({ where: { checkIn: { gte: today, lt: tomorrow }, status: 'confirmed' } }),
      prisma.booking.count({ where: { checkOut: { gte: today, lt: tomorrow }, status: 'checked_in' } }),
      prisma.invoice.count({ where: { status: { in: ['issued', 'partial', 'overdue'] } } }),
    ]);

    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: today, lt: tomorrow } },
    });

    const total = totalRooms || 1;
    res.json({
      rooms: { total_rooms: totalRooms, occupied, available, dirty, maintenance: maint },
      occupancy_rate: Math.round((occupied / total) * 100),
      today_arrivals: arrivals,
      today_checkouts: checkouts,
      revenue_today: revenueResult._sum.amount || 0,
      pending_payments: pendingPayments,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/occupancy', requireRole(...reportRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const totalRooms = await prisma.room.count({ where: { isActive: true } });
    const bookings = await prisma.booking.groupBy({
      by: ['checkIn'],
      _count: { roomId: true },
      where: {
        checkIn: { gte: since },
        status: { in: ['checked_in', 'checked_out'] },
      },
      orderBy: { checkIn: 'asc' },
    });

    const data = bookings.map((booking) => ({
      date: booking.checkIn,
      occupied: booking._count.roomId,
      occupancy: Math.round((booking._count.roomId / (totalRooms || 1)) * 100),
    }));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/revenue', requireRole(...reportRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: since } },
      orderBy: { paymentDate: 'asc' },
    });

    const grouped: Record<string, { revenue: number; transactions: number }> = {};
    for (const payment of payments) {
      const key = payment.paymentDate.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { revenue: 0, transactions: 0 };
      grouped[key].revenue += Number(payment.amount);
      grouped[key].transactions += 1;
    }

    res.json(Object.entries(grouped).map(([period, data]) => ({ period, ...data })));
  } catch (error) {
    next(error);
  }
});

router.get('/booking-sources', requireRole(...reportRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const total = await prisma.booking.count();
    const sources = await prisma.booking.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    });

    res.json(sources.map((source) => ({
      source: source.source,
      count: source._count,
      percentage: total ? Math.round((source._count / total) * 1000) / 10 : 0,
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/guests', requireRole(...dashboardRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        _count: { select: { bookings: true } },
        bookings: { select: { checkOut: true, totalAmount: true }, orderBy: { checkOut: 'desc' }, take: 1 },
      },
      orderBy: { totalStays: 'desc' },
      take: 50,
    });
    res.json(guests);
  } catch (error) {
    next(error);
  }
});

export default router;
