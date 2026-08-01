import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  createBookingSchema,
  recordBookingPaymentSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
} from '../utils/validation.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { paramToInt } from '../utils/params.js';
import { calculateBookingPricing } from '../utils/pricing.js';

const router = Router();
router.use(authMiddleware);

const bookingRoles = ['Administrator', 'Manager', 'Front Office'];
const mealPlanMap: Record<string, 'room_only' | 'bnb' | 'half_board' | 'full_board'> = {
  'room-only': 'room_only',
  bnb: 'bnb',
  'half-board': 'half_board',
  'full-board': 'full_board',
};

const bookingDetailInclude = {
  guest: true,
  reservationGroup: {
    select: {
      id: true,
      groupRef: true,
    },
  },
  room: true,
  roomType: true,
  bookingMeals: {
    include: {
      mealPlan: {
        select: {
          id: true,
          name: true,
          mealType: true,
          price: true,
        },
      },
    },
  },
  invoices: {
    include: {
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
} as const;

const groupBookingListInclude = {
  room: { select: { id: true, roomNumber: true } },
  roomType: { select: { id: true, name: true } },
} as const;

function parseStayDates(checkInValue: string, checkOutValue: string) {
  const checkIn = new Date(checkInValue);
  const checkOut = new Date(checkOutValue);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new BadRequestError('Check-out date must be after check-in date');
  }

  return { checkIn, checkOut, nights };
}

async function ensureRoomTypeAvailability(
  roomTypeId: number,
  checkIn: Date,
  checkOut: Date,
  excludeBookingIds: number[] = [],
  requestedCount = 1,
): Promise<void> {
  const [availableRooms, reservedBookings] = await Promise.all([
    prisma.room.count({
      where: {
        roomTypeId,
        isActive: true,
        status: { notIn: ['maintenance', 'out_of_order'] },
      },
    }),
    prisma.booking.count({
      where: {
        roomTypeId,
        status: { in: ['confirmed', 'checked_in'] },
        ...(excludeBookingIds.length ? { id: { notIn: excludeBookingIds } } : {}),
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
  ]);

  if (reservedBookings + requestedCount > availableRooms) {
    throw new BadRequestError('No rooms of the selected type are available for the chosen dates');
  }
}

async function validateAssignedRoom(
  tx: any,
  options: {
    roomId: number;
    roomTypeId: number;
    checkIn: Date;
    checkOut: Date;
    excludeBookingIds?: number[];
  },
) {
  const room = await tx.room.findUnique({
    where: { id: options.roomId },
    select: { id: true, roomNumber: true, roomTypeId: true, status: true, isActive: true },
  });

  if (!room || !room.isActive) {
    throw new NotFoundError('Room');
  }
  if (room.roomTypeId !== options.roomTypeId) {
    throw new BadRequestError('Selected room does not match the selected room type');
  }
  if (['maintenance', 'out_of_order'].includes(room.status)) {
    throw new BadRequestError('Selected room is not available for booking');
  }

  const overlappingRoomBooking = await tx.booking.findFirst({
    where: {
      roomId: room.id,
      status: { in: ['confirmed', 'checked_in'] },
      ...(options.excludeBookingIds?.length ? { id: { notIn: options.excludeBookingIds } } : {}),
      checkIn: { lt: options.checkOut },
      checkOut: { gt: options.checkIn },
    },
    select: { id: true },
  });

  if (overlappingRoomBooking) {
    throw new BadRequestError('Selected room is already booked for the chosen dates');
  }

  return room;
}

async function getRoomTypeOrThrow(tx: any, roomTypeId: number) {
  const roomType = await tx.roomType.findUnique({
    where: { id: roomTypeId },
    select: { id: true, name: true, basePrice: true, maxOccupancy: true, isActive: true },
  });

  if (!roomType || !roomType.isActive) {
    throw new NotFoundError('Room type');
  }

  return roomType;
}

async function getMealSelections(tx: any, meals: Array<{ mealPlanId: number; quantity: number }> = []): Promise<Map<number, number>> {
  if (!meals.length) {
    return new Map<number, number>();
  }

  const mealPlans = await tx.mealPlan.findMany({
    where: {
      id: { in: meals.map((meal) => meal.mealPlanId) },
      isActive: true,
    },
    select: { id: true, price: true },
  });

  const mealPriceById = new Map<number, number>(mealPlans.map((meal: any) => [meal.id, Number(meal.price)]));

  for (const meal of meals) {
    if (!mealPriceById.has(meal.mealPlanId)) {
      throw new BadRequestError(`Meal plan ${meal.mealPlanId} is not available`);
    }
  }

  return mealPriceById;
}

async function upsertGuest(tx: any, guest: any) {
  if (guest.id) {
    const existingGuest = await tx.guest.findUnique({
      where: { id: guest.id },
      select: { id: true },
    });

    if (!existingGuest) {
      throw new NotFoundError('Guest');
    }

    const updatedGuest = await tx.guest.update({
      where: { id: guest.id },
      data: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email || null,
        phone: guest.phone,
        nationality: guest.nationality,
        idNumber: guest.idNumber,
      },
    });

    return updatedGuest.id;
  }

  const createdGuest = await tx.guest.create({
    data: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || null,
      phone: guest.phone,
      nationality: guest.nationality,
      idNumber: guest.idNumber,
    },
  });

  return createdGuest.id;
}

async function syncBookingMeals(
  tx: any,
  bookingId: number,
  meals: Array<{ mealPlanId: number; quantity: number }> = [],
  mealPriceById: Map<number, number>,
) {
  await tx.bookingMeal.deleteMany({ where: { bookingId } });

  if (!meals.length) {
    return;
  }

  await tx.bookingMeal.createMany({
    data: meals.map((meal) => ({
      bookingId,
      mealPlanId: meal.mealPlanId,
      quantity: meal.quantity,
      unitPrice: mealPriceById.get(meal.mealPlanId)!,
      totalPrice: meal.quantity * mealPriceById.get(meal.mealPlanId)!,
    })),
  });
}

function buildPricing(roomType: any, mealPlan: string, nights: number, additionalMealsTotal: number) {
  const normalizedMealPlan = mealPlanMap[mealPlan];
  if (!normalizedMealPlan) {
    throw new BadRequestError('Invalid meal plan');
  }

  return calculateBookingPricing({
    roomTypeName: roomType.name,
    maxOccupancy: roomType.maxOccupancy,
    basePrice: Number(roomType.basePrice),
    mealPlan: normalizedMealPlan,
    nights,
    additionalMealsTotal,
  });
}

function createBookingRef(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

function normalizeBookingRooms(data: any) {
  if (data.rooms?.length) {
    return data.rooms.map((room: any) => ({
      roomTypeId: room.roomTypeId,
      roomId: room.roomId,
      adults: room.adults,
      children: room.children ?? 0,
      mealPlan: room.mealPlan,
      additionalMeals: room.additionalMeals || [],
    }));
  }

  return [{
    roomTypeId: data.roomTypeId,
    roomId: data.roomId,
    adults: data.adults,
    children: data.children ?? 0,
    mealPlan: data.mealPlan,
    additionalMeals: data.additionalMeals || [],
  }];
}

function summarizeGroupFinancials(bookings: any[]) {
  return bookings.reduce((summary, booking) => ({
    totalAmount: summary.totalAmount + Number(booking.totalAmount || 0),
    advancePaid: summary.advancePaid + Number(booking.advancePaid || 0),
    balanceDue: summary.balanceDue + Number(booking.balanceDue || 0),
  }), { totalAmount: 0, advancePaid: 0, balanceDue: 0 });
}

async function attachReservationGroupContext(tx: any, booking: any) {
  if (!booking || !booking.groupId) {
    return booking;
  }

  const groupBookings = await tx.booking.findMany({
    where: { groupId: booking.groupId },
    include: groupBookingListInclude,
    orderBy: [{ roomTypeId: 'asc' }, { id: 'asc' }],
  });

  const totals = summarizeGroupFinancials(groupBookings);

  return {
    ...booking,
    groupSummary: {
      id: booking.reservationGroup?.id ?? booking.groupId,
      groupRef: booking.reservationGroup?.groupRef ?? null,
      roomsCount: groupBookings.length,
      totalAmount: totals.totalAmount,
      advancePaid: totals.advancePaid,
      balanceDue: totals.balanceDue,
      bookings: groupBookings,
    },
  };
}

async function getBookingDetailsWithContext(tx: any, bookingId: number) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });

  if (!booking) {
    return null;
  }

  return attachReservationGroupContext(tx, booking);
}

router.get('/', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, from, to, search } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (from) where.checkIn = { gte: new Date(from as string) };
    if (to) where.checkOut = { ...(where.checkOut || {}), lte: new Date(to as string) };
    if (search) {
      where.OR = [
        { bookingRef: { contains: search as string } },
        { guest: { firstName: { contains: search as string } } },
        { guest: { lastName: { contains: search as string } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { id: true, roomNumber: true } },
          roomType: { select: { id: true, name: true } },
        },
        orderBy: { checkIn: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json(paginatedResponse(bookings, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

router.get('/arrivals/today', requireRole(...bookingRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const arrivals = await prisma.booking.findMany({
      where: { checkIn: { gte: today, lt: tomorrow }, status: 'confirmed' },
      include: {
        guest: { select: { firstName: true, lastName: true, phone: true } },
        room: { select: { id: true, roomNumber: true } },
        roomType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(arrivals);
  } catch (error) {
    next(error);
  }
});

router.get('/checkouts/today', requireRole(...bookingRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkouts = await prisma.booking.findMany({
      where: { checkOut: { gte: today, lt: tomorrow }, status: 'checked_in' },
      include: {
        guest: { select: { firstName: true, lastName: true, phone: true } },
        room: { select: { id: true, roomNumber: true } },
        roomType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(checkouts);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await getBookingDetailsWithContext(prisma, paramToInt(req.params.id));
    if (!booking) throw new NotFoundError('Booking');
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const { checkIn, checkOut, nights } = parseStayDates(data.checkIn, data.checkOut);
    const rooms = normalizeBookingRooms(data);

    const assignedRoomIds = rooms
      .map((room: any) => room.roomId)
      .filter((roomId: number | undefined): roomId is number => Boolean(roomId));
    if (new Set(assignedRoomIds).size !== assignedRoomIds.length) {
      throw new BadRequestError('Each linked reservation must use a different assigned room');
    }

    const roomTypeRequestCounts = rooms.reduce((counts: Map<number, number>, room: any) => {
      counts.set(room.roomTypeId, (counts.get(room.roomTypeId) || 0) + 1);
      return counts;
    }, new Map<number, number>());

    for (const [roomTypeId, requestedCount] of roomTypeRequestCounts.entries()) {
      await ensureRoomTypeAvailability(roomTypeId, checkIn, checkOut, [], requestedCount);
    }

    const result = await prisma.$transaction(async (tx) => {
      const guestId = await upsertGuest(tx, data.guest);
      const reservationGroup = rooms.length > 1
        ? await (tx as any).reservationGroup.create({
            data: {
              groupRef: createBookingRef('GRP'),
              guestId,
              notes: data.specialRequests,
              createdBy: req.user!.id,
            },
          })
        : null;

      const createdBookingIds: number[] = [];

      for (const roomRequest of rooms) {
        const roomType = await getRoomTypeOrThrow(tx, roomRequest.roomTypeId);

        if (roomRequest.roomId) {
          await validateAssignedRoom(tx, {
            roomId: roomRequest.roomId,
            roomTypeId: roomRequest.roomTypeId,
            checkIn,
            checkOut,
          });
        }

        const mealPriceById = await getMealSelections(tx, roomRequest.additionalMeals || []);
        const additionalMealsTotal = (roomRequest.additionalMeals || []).reduce((sum: number, meal: any) => (
          sum + (mealPriceById.get(meal.mealPlanId) || 0) * meal.quantity
        ), 0);
        const pricing = buildPricing(roomType, roomRequest.mealPlan, nights, additionalMealsTotal);

        const booking = await tx.booking.create({
          data: {
            bookingRef: createBookingRef('BK'),
            guestId,
            groupId: reservationGroup?.id,
            roomId: roomRequest.roomId,
            roomTypeId: roomRequest.roomTypeId,
            checkIn,
            checkOut,
            nights,
            adults: roomRequest.adults,
            children: roomRequest.children,
            mealPlan: mealPlanMap[roomRequest.mealPlan] as any,
            roomRate: pricing.roomRate,
            mealSurcharge: pricing.mealSurcharge,
            subtotal: pricing.subtotal,
            taxAmount: pricing.taxAmount,
            serviceCharge: pricing.serviceCharge,
            totalAmount: pricing.totalAmount,
            advancePaid: 0,
            balanceDue: pricing.balanceDue,
            source: data.source as any,
            specialRequests: data.specialRequests,
            createdBy: req.user!.id,
          } as any,
        });

        await syncBookingMeals(tx, booking.id, roomRequest.additionalMeals || [], mealPriceById);
        createdBookingIds.push(booking.id);
      }

      return getBookingDetailsWithContext(tx, createdBookingIds[0]);
    });

    logger.info(`Booking created: ${result!.bookingRef}${rooms.length > 1 ? ' (group)' : ''}`);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookingId = paramToInt(req.params.id);
    const data = updateBookingSchema.parse(req.body);
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingRef: true,
        status: true,
        guestId: true,
        roomId: true,
        advancePaid: true,
        groupId: true,
      },
    });

    if (!existingBooking) throw new NotFoundError('Booking');
    if (existingBooking.status !== 'confirmed') {
      throw new BadRequestError('Only confirmed bookings can be edited from the reservation screen');
    }

    const { checkIn, checkOut, nights } = parseStayDates(data.checkIn, data.checkOut);
    const rooms = normalizeBookingRooms(data);
    const assignedRoomIds = rooms
      .map((room: any) => room.roomId)
      .filter((roomId: number | undefined): roomId is number => Boolean(roomId));

    if (new Set(assignedRoomIds).size !== assignedRoomIds.length) {
      throw new BadRequestError('Each linked reservation must use a different assigned room');
    }

    if (existingBooking.groupId && data.rooms?.length) {
      const existingGroupBookings = await prisma.booking.findMany({
        where: { groupId: existingBooking.groupId },
        select: {
          id: true,
          bookingRef: true,
          status: true,
          guestId: true,
          roomId: true,
          advancePaid: true,
        },
        orderBy: { id: 'asc' },
      });

      if (existingGroupBookings.some((booking) => booking.status !== 'confirmed')) {
        throw new BadRequestError('Every booking in the reservation group must still be confirmed before editing the group');
      }

      const existingGroupBookingMap = new Map(existingGroupBookings.map((booking) => [booking.id, booking]));
      const orderedGroupBookings = rooms.map((room: any, index: number) => {
        const targetBookingId = room.bookingId ?? (index === 0 ? bookingId : undefined);
        const targetBooking = targetBookingId ? existingGroupBookingMap.get(targetBookingId) : undefined;
        if (!targetBooking) {
          throw new BadRequestError('Each room in the edited reservation group must map to an existing booking');
        }
        return targetBooking;
      });

      if (new Set(orderedGroupBookings.map((booking: (typeof existingGroupBookings)[number]) => booking.id)).size !== existingGroupBookings.length) {
        throw new BadRequestError('Edited reservation groups must include every original room exactly once');
      }

      const excludedBookingIds = orderedGroupBookings.map((booking: (typeof existingGroupBookings)[number]) => booking.id);
      const roomTypeRequestCounts = rooms.reduce((counts: Map<number, number>, room: any) => {
        counts.set(room.roomTypeId, (counts.get(room.roomTypeId) || 0) + 1);
        return counts;
      }, new Map<number, number>());

      for (const [roomTypeId, requestedCount] of roomTypeRequestCounts.entries()) {
        await ensureRoomTypeAvailability(roomTypeId, checkIn, checkOut, excludedBookingIds, requestedCount);
      }

      const result = await prisma.$transaction(async (tx) => {
        const guestId = await upsertGuest(tx, {
          ...data.guest,
          id: data.guest.id ?? existingBooking.guestId,
        });

        for (const [index, roomRequest] of rooms.entries()) {
          const targetBooking = orderedGroupBookings[index];
          const roomType = await getRoomTypeOrThrow(tx, roomRequest.roomTypeId);
          const assignedRoomId = roomRequest.roomId ?? targetBooking.roomId ?? undefined;

          if (assignedRoomId) {
            await validateAssignedRoom(tx, {
              roomId: assignedRoomId,
              roomTypeId: roomRequest.roomTypeId,
              checkIn,
              checkOut,
              excludeBookingIds: excludedBookingIds,
            });
          }

          const mealPriceById = await getMealSelections(tx, roomRequest.additionalMeals || []);
          const additionalMealsTotal = (roomRequest.additionalMeals || []).reduce((sum: number, meal: any) => (
            sum + (mealPriceById.get(meal.mealPlanId) || 0) * meal.quantity
          ), 0);
          const pricing = buildPricing(roomType, roomRequest.mealPlan, nights, additionalMealsTotal);
          const advancePaid = Number(targetBooking.advancePaid || 0);

          await tx.booking.update({
            where: { id: targetBooking.id },
            data: {
              guestId,
              roomId: assignedRoomId ?? null,
              roomTypeId: roomRequest.roomTypeId,
              checkIn,
              checkOut,
              nights,
              adults: roomRequest.adults,
              children: roomRequest.children,
              mealPlan: mealPlanMap[roomRequest.mealPlan] as any,
              roomRate: pricing.roomRate,
              mealSurcharge: pricing.mealSurcharge,
              subtotal: pricing.subtotal,
              taxAmount: pricing.taxAmount,
              serviceCharge: pricing.serviceCharge,
              totalAmount: pricing.totalAmount,
              advancePaid,
              balanceDue: Math.max(pricing.totalAmount - advancePaid, 0),
              source: data.source as any,
              specialRequests: data.specialRequests,
            },
          });

          await syncBookingMeals(tx, targetBooking.id, roomRequest.additionalMeals || [], mealPriceById);
        }

        return getBookingDetailsWithContext(tx, bookingId);
      });

      logger.info(`Booking group updated: ${existingBooking.bookingRef}`);
      res.json(result);
      return;
    }

    const assignedRoomId = data.roomId ?? existingBooking.roomId ?? undefined;
    const roomType = await getRoomTypeOrThrow(prisma, data.roomTypeId!);
    await ensureRoomTypeAvailability(roomType.id, checkIn, checkOut, [bookingId]);

    if (assignedRoomId) {
      await validateAssignedRoom(prisma, {
        roomId: assignedRoomId,
        roomTypeId: data.roomTypeId!,
        checkIn,
        checkOut,
        excludeBookingIds: [bookingId],
      });
    }

    const mealPriceById = await getMealSelections(prisma, data.additionalMeals || []);
    const additionalMealsTotal = (data.additionalMeals || []).reduce((sum, meal) => (
      sum + (mealPriceById.get(meal.mealPlanId) || 0) * meal.quantity
    ), 0);
    const pricing = buildPricing(roomType, data.mealPlan, nights, additionalMealsTotal);
    const advancePaid = Number(existingBooking.advancePaid || 0);

    const result = await prisma.$transaction(async (tx) => {
      const guestId = await upsertGuest(tx, {
        ...data.guest,
        id: data.guest.id ?? existingBooking.guestId,
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          guestId,
          roomId: assignedRoomId ?? null,
          roomTypeId: data.roomTypeId!,
          checkIn,
          checkOut,
          nights,
          adults: data.adults!,
          children: data.children,
          mealPlan: mealPlanMap[data.mealPlan] as any,
          roomRate: pricing.roomRate,
          mealSurcharge: pricing.mealSurcharge,
          subtotal: pricing.subtotal,
          taxAmount: pricing.taxAmount,
          serviceCharge: pricing.serviceCharge,
          totalAmount: pricing.totalAmount,
          advancePaid,
          balanceDue: Math.max(pricing.totalAmount - advancePaid, 0),
          source: data.source as any,
          specialRequests: data.specialRequests,
        },
      });

      await syncBookingMeals(tx, bookingId, data.additionalMeals || [], mealPriceById);

      return getBookingDetailsWithContext(tx, bookingId);
    });

    logger.info(`Booking updated: ${existingBooking.bookingRef}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.patch('/:id/payment', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookingId = paramToInt(req.params.id);
    const data = recordBookingPaymentSchema.parse(req.body);
    const amount = Number(data.amount);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingRef: true,
        guestId: true,
        status: true,
        subtotal: true,
        taxAmount: true,
        serviceCharge: true,
        totalAmount: true,
        advancePaid: true,
        balanceDue: true,
      },
    });

    if (!booking) throw new NotFoundError('Booking');
    if (['cancelled', 'no_show'].includes(booking.status)) {
      throw new BadRequestError('Payments cannot be recorded against cancelled or no-show bookings');
    }

    const currentBalance = Number(booking.balanceDue || 0);
    if (currentBalance <= 0) {
      throw new BadRequestError('This booking is already fully paid');
    }
    if (amount > currentBalance + 0.009) {
      throw new BadRequestError('Payment amount cannot exceed the outstanding balance');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingInvoice = await tx.invoice.findFirst({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
      });

      const invoice = existingInvoice
        ? await tx.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              subtotal: Number(booking.subtotal),
              taxAmount: Number(booking.taxAmount),
              serviceCharge: Number(booking.serviceCharge),
              totalAmount: Number(booking.totalAmount),
              paidAmount: Number(existingInvoice.paidAmount || 0) + amount,
              balanceDue: Math.max(Number(booking.totalAmount) - (Number(existingInvoice.paidAmount || 0) + amount), 0),
              status: amount >= currentBalance ? 'paid' : 'partial',
              notes: data.notes || existingInvoice.notes,
              guestId: booking.guestId,
            },
          })
        : await tx.invoice.create({
            data: {
              invoiceNumber: createBookingRef('INV'),
              bookingId,
              guestId: booking.guestId,
              subtotal: Number(booking.subtotal),
              taxAmount: Number(booking.taxAmount),
              serviceCharge: Number(booking.serviceCharge),
              totalAmount: Number(booking.totalAmount),
              paidAmount: amount,
              balanceDue: Math.max(Number(booking.totalAmount) - amount, 0),
              status: amount >= currentBalance ? 'paid' : 'partial',
              notes: data.notes,
              createdBy: req.user!.id,
            },
          });

      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          paymentMethod: data.paymentMethod as any,
          referenceNo: data.referenceNo,
          notes: data.notes,
          receivedBy: req.user!.id,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          advancePaid: Number(booking.advancePaid || 0) + amount,
          balanceDue: Math.max(currentBalance - amount, 0),
          notes: data.notes ? data.notes : undefined,
        },
      });

      return getBookingDetailsWithContext(tx, bookingId);
    });

    logger.info(`Booking payment recorded: ${booking.bookingRef} (${amount})`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRole(...bookingRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, roomId, notes } = updateBookingStatusSchema.parse(req.body);
    const bookingId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          bookingRef: true,
          guestId: true,
          roomId: true,
          roomTypeId: true,
          status: true,
          notes: true,
          checkIn: true,
          checkOut: true,
          balanceDue: true,
        },
      });

      if (!booking) throw new NotFoundError('Booking');

      if (status === 'checked_in') {
        if (booking.status !== 'confirmed') {
          throw new BadRequestError('Only confirmed bookings can be checked in');
        }

        const assignedRoomId = roomId ?? booking.roomId;
        if (!assignedRoomId) {
          throw new BadRequestError('Assign a room before check-in');
        }

        const room = await validateAssignedRoom(tx, {
          roomId: assignedRoomId,
          roomTypeId: booking.roomTypeId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          excludeBookingIds: [bookingId],
        });

        if (room.status !== 'available') {
          throw new BadRequestError('Room must be available before check-in');
        }

        if (booking.roomId && booking.roomId !== assignedRoomId) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { status: 'available' },
          });
        }

        await tx.room.update({ where: { id: assignedRoomId }, data: { status: 'occupied' } });

        return tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'checked_in' as any,
            roomId: assignedRoomId,
            notes: notes ?? booking.notes,
          },
        });
      }

      if (status === 'checked_out') {
        if (booking.status !== 'checked_in') {
          throw new BadRequestError('Only checked-in bookings can be checked out');
        }
        if (Number(booking.balanceDue || 0) > 0.009) {
          throw new BadRequestError('Settle the outstanding balance before checkout');
        }
        if (!booking.roomId) {
          throw new BadRequestError('Checked-in booking is missing an assigned room');
        }

        await tx.room.update({ where: { id: booking.roomId }, data: { status: 'dirty' } });
        await tx.guest.update({
          where: { id: booking.guestId },
          data: { totalStays: { increment: 1 } },
        });

        return tx.booking.update({
          where: { id: bookingId },
          data: { status: 'checked_out' as any, notes: notes ?? booking.notes },
        });
      }

      if (status === 'cancelled' || status === 'no_show') {
        if (booking.status !== 'confirmed') {
          throw new BadRequestError('Only confirmed bookings can be cancelled or marked as no-show');
        }

        return tx.booking.update({
          where: { id: bookingId },
          data: { status: status as any, notes: notes ?? booking.notes },
        });
      }

      if (status === 'confirmed') {
        return tx.booking.update({
          where: { id: bookingId },
          data: {
            roomId: roomId ?? booking.roomId,
            notes: notes ?? booking.notes,
          },
        });
      }

      throw new BadRequestError('Unsupported booking status transition');
    });

    logger.info(`Booking ${result.bookingRef} status -> ${status}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;














