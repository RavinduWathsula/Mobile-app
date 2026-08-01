import {
  InvoiceStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethodType,
  PaymentStatusType,
} from '@prisma/client';
import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  appendRestaurantOrderItemsSchema,
  createMealPlanSchema,
  createMenuItemSchema,
  createOrderSchema,
  createRestaurantCategorySchema,
  createRestaurantRefundSchema,
  createRestaurantTableSchema,
  requestRestaurantVoidSchema,
  updateRestaurantCategorySchema,
  updateRestaurantOrderItemStatusSchema,
  updateRestaurantOrderStatusSchema,
  updateRestaurantPaymentSchema,
  updateRestaurantSettingsSchema,
  updateRestaurantTableSchema,
} from '../utils/validation.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { paramToInt } from '../utils/params.js';
import { readRestaurantConfig, writeRestaurantConfig } from '../utils/restaurant-config.js';

const router = Router();

const restaurantRoles = ['Administrator', 'Manager', 'Restaurant Staff'];
const managerRoles = ['Administrator', 'Manager'];
const HELD_PREFIX = '[HELD]';
const ORDER_META_PREFIX = '[POS_META]';

type RestaurantDbClient = Pick<
  typeof prisma,
  'auditLog' | 'booking' | 'invoice' | 'mealPlan' | 'menuCategory' | 'menuItem' | 'orderItem' | 'payment' | 'restaurantOrder'
>;

type ParsedOrderInput = ReturnType<typeof createOrderSchema.parse>;

type OrderFinancials = {
  subtotal: number;
  discount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
};

function buildOrderNumber() {
  return `ORD-${Date.now().toString().slice(-8)}`;
}

function buildInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-8)}`;
}

function calculateRestaurantTotals(
  lines: Array<{ quantity: number; unitPrice: number }>,
  pricing: { taxRate: number; serviceChargeRate: number },
  discountValue = 0,
): OrderFinancials {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = Math.min(Math.max(discountValue, 0), subtotal);
  const taxableSubtotal = subtotal - discount;
  const taxAmount = taxableSubtotal * pricing.taxRate;
  const serviceCharge = taxableSubtotal * pricing.serviceChargeRate;
  const totalAmount = taxableSubtotal + taxAmount + serviceCharge;

  return {
    subtotal,
    discount,
    taxAmount,
    serviceCharge,
    totalAmount,
  };
}

function deriveOrderStatus(itemStatuses: OrderItemStatus[]): OrderStatus {
  const activeStatuses = itemStatuses.filter((status) => status !== OrderItemStatus.cancelled);

  if (activeStatuses.length === 0) {
    return OrderStatus.cancelled;
  }

  if (activeStatuses.every((status) => status === OrderItemStatus.served)) {
    return OrderStatus.served;
  }

  if (
    activeStatuses.some((status) => status === OrderItemStatus.ready)
    && activeStatuses.every((status) => status === OrderItemStatus.ready || status === OrderItemStatus.served)
  ) {
    return OrderStatus.ready;
  }

  if (activeStatuses.some((status) => status === OrderItemStatus.preparing)) {
    return OrderStatus.preparing;
  }

  return OrderStatus.pending;
}

function derivePaymentStatus(totalAmount: number, paidAmount: number, paymentMethod?: PaymentMethodType | null) {
  if (paymentMethod === PaymentMethodType.room_charge) {
    return PaymentStatusType.unpaid;
  }

  if (paidAmount <= 0) {
    return PaymentStatusType.unpaid;
  }

  if (paidAmount + 0.001 >= totalAmount) {
    return PaymentStatusType.paid;
  }

  return PaymentStatusType.partial;
}

function isHeldNotes(notes?: string | null) {
  return Boolean(notes?.trim().startsWith(HELD_PREFIX));
}

function markHeldNotes(notes?: string | null) {
  const cleanNotes = unmarkHeldNotes(notes);
  return cleanNotes ? `${HELD_PREFIX}\n${cleanNotes}` : HELD_PREFIX;
}

function unmarkHeldNotes(notes?: string | null) {
  if (!notes) {
    return null;
  }

  const cleaned = notes.replace(`${HELD_PREFIX}\n`, '').replace(HELD_PREFIX, '').trim();
  return cleaned || null;
}

function parseOrderNotes(notes?: string | null) {
  const meta = new Map<string, string>();
  const contentLines: string[] = [];

  for (const line of (notes || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith(ORDER_META_PREFIX)) {
      const payload = trimmed.slice(ORDER_META_PREFIX.length).trim();
      const separatorIndex = payload.indexOf('=');
      if (separatorIndex > 0) {
        const key = payload.slice(0, separatorIndex).trim();
        const value = payload.slice(separatorIndex + 1).trim();
        if (key && value) {
          meta.set(key, value);
          continue;
        }
      }
    }

    if (trimmed.length > 0 || contentLines.length > 0) {
      contentLines.push(line);
    }
  }

  return {
    meta,
    content: contentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
  };
}

function buildOrderNotes(meta: Map<string, string>, content?: string | null) {
  const metaLines = Array.from(meta.entries()).map(([key, value]) => `${ORDER_META_PREFIX} ${key}=${value}`);
  const cleanContent = content?.trim();

  if (cleanContent) {
    metaLines.push('', cleanContent);
  }

  const combined = metaLines.join('\n').trim();
  return combined || null;
}

function combineNotes(existingNotes?: string | null, nextNotes?: string | null) {
  const existing = parseOrderNotes(existingNotes);
  const next = parseOrderNotes(nextNotes);

  const mergedMeta = new Map(existing.meta);
  for (const [key, value] of next.meta.entries()) {
    mergedMeta.set(key, value);
  }

  const contentParts = [existing.content, next.content].filter(Boolean);
  const mergedContent = [...new Set(contentParts)].join('\n\n');

  return buildOrderNotes(mergedMeta, mergedContent);
}

function normalizePublicMenuPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/qr-menu';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizeTableCode(value: string) {
  return value.trim();
}

function matchesTableCode(left: string, right: string) {
  return normalizeTableCode(left).toLowerCase() === normalizeTableCode(right).toLowerCase();
}

function normalizeRestaurantTableData(data: ReturnType<typeof createRestaurantTableSchema.parse>) {
  return {
    code: normalizeTableCode(data.code),
    name: data.name.trim(),
    area: data.area?.trim() || 'Restaurant',
    capacity: data.capacity,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };
}

function normalizeRestaurantSettingsData(data: ReturnType<typeof updateRestaurantSettingsSchema.parse>) {
  return {
    ...data,
    supportedLabels: data.supportedLabels?.map((label: string) => label.trim()).filter(Boolean),
    modifierPresets: data.modifierPresets?.map((preset: string) => preset.trim()).filter(Boolean),
    publicMenuPath: data.publicMenuPath ? normalizePublicMenuPath(data.publicMenuPath) : undefined,
    publicMenuTitle: data.publicMenuTitle?.trim(),
    publicMenuDescription: data.publicMenuDescription?.trim(),
    roomChargePolicy: data.roomChargePolicy?.trim(),
    assetCollectionNotes: data.assetCollectionNotes?.trim(),
    qrAssetMode: data.qrAssetMode?.trim(),
  };
}

function deriveTableStatus(orders: Array<{ status: OrderStatus; notes?: string | null }>) {
  if (orders.some((order) => order.status === OrderStatus.served && !isHeldNotes(order.notes))) {
    return 'payment_due';
  }

  if (orders.some((order) => isHeldNotes(order.notes))) {
    return 'held';
  }

  if (orders.length > 0) {
    return 'occupied';
  }

  return 'available';
}

async function getHydratedOrder(tx: RestaurantDbClient, orderId: number) {
  return tx.restaurantOrder.findUnique({
    where: { id: orderId },
    include: {
      room: { select: { roomNumber: true } },
      guest: { select: { firstName: true, lastName: true } },
      booking: { select: { id: true, bookingRef: true, status: true } },
      creator: { select: { id: true, fullName: true, username: true } },
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              categoryId: true,
              preparationTime: true,
              isAvailable: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      },
      invoices: {
        include: {
          payments: {
            include: {
              receiver: { select: { id: true, fullName: true, username: true } },
            },
            orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }],
          },
        },
        orderBy: { id: 'desc' },
      },
    },
  });
}

async function resolveOrderContext(tx: RestaurantDbClient, order: ParsedOrderInput) {
  const tableNumber = order.tableNumber?.trim();

  if (order.orderType === 'dine_in') {
    if (!tableNumber) {
      throw new BadRequestError('Table orders require a table number');
    }

    const config = await readRestaurantConfig();
    const activeTable = config.tables.find((table) => table.isActive && matchesTableCode(table.code, tableNumber));
    if (!activeTable) {
      throw new BadRequestError('Select an active restaurant table');
    }

    return {
      tableNumber: activeTable.code,
      roomId: null,
      guestId: null,
      bookingId: null,
    };
  }

  if (order.orderType !== 'room_service') {
    return {
      tableNumber: null,
      roomId: null,
      guestId: null,
      bookingId: null,
    };
  }

  if (!order.bookingId) {
    throw new BadRequestError('Room-service orders require an active checked-in booking');
  }

  const booking = await tx.booking.findUnique({
    where: { id: order.bookingId },
    select: {
      id: true,
      status: true,
      guestId: true,
      roomId: true,
    },
  });

  if (!booking || booking.status !== 'checked_in' || !booking.roomId || !booking.guestId) {
    throw new BadRequestError('Room-service orders require an active checked-in booking');
  }

  if (order.roomId && order.roomId !== booking.roomId) {
    throw new BadRequestError('Room-service room does not match the booking');
  }

  if (order.guestId && order.guestId !== booking.guestId) {
    throw new BadRequestError('Room-service guest does not match the booking');
  }

  return {
    tableNumber: null,
    roomId: booking.roomId,
    guestId: booking.guestId,
    bookingId: booking.id,
  };
}

async function loadAvailableMenuPrices(tx: RestaurantDbClient, items: Array<{ menuItemId: number }>) {
  const uniqueMenuItemIds = [...new Set(items.map((item) => item.menuItemId))];
  const menuItems = await tx.menuItem.findMany({
    where: {
      id: { in: uniqueMenuItemIds },
      isAvailable: true,
    },
    select: { id: true, price: true },
  });

  if (menuItems.length !== uniqueMenuItemIds.length) {
    throw new BadRequestError('One or more menu items are unavailable');
  }

  return new Map(menuItems.map((item) => [item.id, Number(item.price)]));
}

async function ensureInvoiceForOrder(
  tx: RestaurantDbClient,
  orderId: number,
  financials: OrderFinancials,
  paidAmount: number,
  status: InvoiceStatus,
  createdBy: number,
  notes?: string | null,
) {
  const existingInvoice = await tx.invoice.findFirst({
    where: { orderId },
    orderBy: { id: 'desc' },
  });

  const invoiceData = {
    subtotal: financials.subtotal,
    taxAmount: financials.taxAmount,
    serviceCharge: financials.serviceCharge,
    discount: financials.discount,
    totalAmount: financials.totalAmount,
    paidAmount,
    balanceDue: Math.max(financials.totalAmount - paidAmount, 0),
    status,
    notes: notes?.trim() || null,
    createdBy,
  };

  if (existingInvoice) {
    return tx.invoice.update({
      where: { id: existingInvoice.id },
      data: invoiceData,
    });
  }

  return tx.invoice.create({
    data: {
      invoiceNumber: buildInvoiceNumber(),
      orderId,
      ...invoiceData,
    },
  });
}

async function createAuditLog(
  tx: RestaurantDbClient,
  req: AuthRequest,
  action: string,
  entityId: number,
  oldValues: unknown,
  newValues: unknown,
) {
  await tx.auditLog.create({
    data: {
      userId: req.user?.id,
      action,
      entityType: 'restaurant_order',
      entityId,
      oldValues: oldValues as any,
      newValues: newValues as any,
      ipAddress: req.ip,
    },
  });
}

router.get('/public-menu', async (_req, res: Response, next: NextFunction) => {
  try {
    const config = await readRestaurantConfig();
    const [categories, items] = await Promise.all([
      prisma.menuCategory.findMany({
        where: { isActive: true },
        include: { _count: { select: { items: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          category: { isActive: true },
        },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    res.json({
      settings: config.settings,
      categories: categories.filter((category) => (category._count?.items ?? 0) > 0),
      items,
    });
  } catch (error) {
    next(error);
  }
});

router.use(authMiddleware);

router.get('/settings', requireRole(...restaurantRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config = await readRestaurantConfig();
    res.json(config.settings);
  } catch (error) {
    next(error);
  }
});

router.patch('/settings', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payload = normalizeRestaurantSettingsData(updateRestaurantSettingsSchema.parse(req.body));
    const config = await writeRestaurantConfig({ settings: payload });
    res.json(config.settings);
  } catch (error) {
    next(error);
  }
});

router.get('/tables', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { active } = req.query;
    const config = await readRestaurantConfig();
    const visibleTables = active === 'all' ? config.tables : config.tables.filter((table) => table.isActive);
    const openOrders = await prisma.restaurantOrder.findMany({
      where: {
        orderType: 'dine_in',
        tableNumber: { not: null },
        status: { notIn: [OrderStatus.completed, OrderStatus.cancelled] },
      },
      select: {
        id: true,
        tableNumber: true,
        orderNumber: true,
        status: true,
        notes: true,
        updatedAt: true,
        creator: { select: { fullName: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const ordersByTable = new Map<string, typeof openOrders>();
    for (const order of openOrders) {
      const key = normalizeTableCode(order.tableNumber || '');
      if (!key) {
        continue;
      }
      const current = ordersByTable.get(key) ?? [];
      current.push(order);
      ordersByTable.set(key, current);
    }

    res.json(visibleTables.map((table) => {
      const tableOrders = ordersByTable.get(table.code) ?? [];
      const leadOrder = tableOrders[0] ?? null;
      return {
        ...table,
        status: table.isActive ? deriveTableStatus(tableOrders) : 'available',
        openOrderCount: tableOrders.length,
        currentOrderId: leadOrder?.id ?? null,
        currentOrderNumber: leadOrder?.orderNumber ?? null,
        currentWaiter: leadOrder ? (leadOrder.creator?.fullName || leadOrder.creator?.username || null) : null,
      };
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/tables', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payload = normalizeRestaurantTableData(createRestaurantTableSchema.parse(req.body));
    const config = await readRestaurantConfig();

    if (config.tables.some((table) => matchesTableCode(table.code, payload.code))) {
      throw new BadRequestError('A table with this code already exists');
    }

    const nextId = config.tables.reduce((max, table) => Math.max(max, table.id), 0) + 1;
    const nextTable = { id: nextId, ...payload };
    const nextConfig = await writeRestaurantConfig({ tables: [...config.tables, nextTable] });
    res.status(201).json(nextConfig.tables.find((table) => table.id === nextId));
  } catch (error) {
    next(error);
  }
});

router.patch('/tables/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tableId = paramToInt(req.params.id);
    const data = updateRestaurantTableSchema.parse(req.body);
    const config = await readRestaurantConfig();
    const currentTable = config.tables.find((table) => table.id === tableId);

    if (!currentTable) {
      throw new NotFoundError('Table');
    }

    const nextCode = data.code ? normalizeTableCode(data.code) : currentTable.code;
    if (config.tables.some((table) => table.id !== tableId && matchesTableCode(table.code, nextCode))) {
      throw new BadRequestError('A table with this code already exists');
    }

    const openOrders = await prisma.restaurantOrder.findMany({
      where: {
        orderType: 'dine_in',
        tableNumber: currentTable.code,
        status: { notIn: [OrderStatus.completed, OrderStatus.cancelled] },
      },
      select: { id: true },
    });

    if ((data.code && !matchesTableCode(currentTable.code, nextCode)) || data.isActive === false) {
      if (openOrders.length > 0) {
        throw new BadRequestError('Close or move active orders before changing this table');
      }
    }

    const nextConfig = await writeRestaurantConfig({
      tables: config.tables.map((table) => (table.id === tableId ? {
        ...table,
        ...(data.code ? { code: nextCode } : {}),
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.area !== undefined ? { area: data.area?.trim() || 'Restaurant' } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      } : table)),
    });

    res.json(nextConfig.tables.find((table) => table.id === tableId));
  } catch (error) {
    next(error);
  }
});

router.delete('/tables/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tableId = paramToInt(req.params.id);
    const config = await readRestaurantConfig();
    const currentTable = config.tables.find((table) => table.id === tableId);

    if (!currentTable) {
      throw new NotFoundError('Table');
    }

    const openOrders = await prisma.restaurantOrder.findMany({
      where: {
        orderType: 'dine_in',
        tableNumber: currentTable.code,
        status: { notIn: [OrderStatus.completed, OrderStatus.cancelled] },
      },
      select: { id: true },
    });

    if (openOrders.length > 0) {
      throw new BadRequestError('Close active orders before deleting this table');
    }

    if (config.tables.length <= 1) {
      throw new BadRequestError('Keep at least one table in the restaurant configuration');
    }

    await writeRestaurantConfig({ tables: config.tables.filter((table) => table.id !== tableId) });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/categories', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { active } = req.query;
    const where = active === 'all' ? {} : { isActive: active === 'false' ? false : true };

    const categories = await prisma.menuCategory.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRestaurantCategorySchema.parse(req.body);
    const category = await prisma.menuCategory.create({ data });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.patch('/categories/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = paramToInt(req.params.id);
    const data = updateRestaurantCategorySchema.parse(req.body);
    const category = await prisma.menuCategory.update({
      where: { id: categoryId },
      data,
    });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = paramToInt(req.params.id);
    const linkedItems = await prisma.menuItem.findMany({
      where: { categoryId },
      select: { id: true },
      take: 1,
    });

    if (linkedItems.length > 0) {
      throw new BadRequestError('Move or hide menu items before deleting this category');
    }

    await prisma.menuCategory.delete({ where: { id: categoryId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/menu', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, available } = req.query;
    const where: Record<string, unknown> = {};

    if (category) {
      where.categoryId = parseInt(category as string, 10);
    }

    if (available === 'true') {
      where.isAvailable = true;
    } else if (available === 'false') {
      where.isAvailable = false;
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/menu', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMenuItemSchema.parse(req.body);
    const item = await prisma.menuItem.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/menu/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMenuItemSchema.parse(req.body);
    const item = await prisma.menuItem.update({
      where: { id: paramToInt(req.params.id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get('/orders', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, tableNumber, active, held, mine, q } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (tableNumber) {
      where.tableNumber = String(tableNumber).trim();
    }

    if (active === 'true') {
      where.status = { notIn: [OrderStatus.completed, OrderStatus.cancelled] };
    }

    if (mine === 'true') {
      where.createdBy = req.user!.id;
    }

    const search = (q as string | undefined)?.trim();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { tableNumber: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where,
        include: {
          room: { select: { roomNumber: true } },
          guest: { select: { firstName: true, lastName: true } },
          booking: { select: { id: true, bookingRef: true, status: true } },
          creator: { select: { id: true, fullName: true, username: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              status: true,
              specialInstructions: true,
              unitPrice: true,
              totalPrice: true,
              menuItem: { select: { name: true } },
            },
            orderBy: { id: 'asc' },
          },
          invoices: {
            include: {
              payments: {
                select: {
                  id: true,
                  amount: true,
                  paymentMethod: true,
                },
              },
            },
            orderBy: { id: 'desc' },
          },
          _count: { select: { items: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.restaurantOrder.count({ where }),
    ]);

    const filteredOrders = held === undefined
      ? orders
      : orders.filter((order) => (held === 'true' ? isHeldNotes(order.notes) : !isHeldNotes(order.notes)));

    res.json(paginatedResponse(filteredOrders, total, { page, limit, skip }));
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getHydratedOrder(prisma, paramToInt(req.params.id));
    if (!order) throw new NotFoundError('Order');
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/orders', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const config = await readRestaurantConfig();
    const pricing = { taxRate: config.settings.taxRate, serviceChargeRate: config.settings.serviceChargeRate };

    const result = await prisma.$transaction(async (tx) => {
      const orderContext = await resolveOrderContext(tx, data);
      const priceByItemId = await loadAvailableMenuPrices(tx, data.items);
      const totals = calculateRestaurantTotals(
        data.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: priceByItemId.get(item.menuItemId) || 0,
        })),
        pricing,
      );

      const createdOrder = await tx.restaurantOrder.create({
        data: {
          orderNumber: buildOrderNumber(),
          orderType: data.orderType as any,
          tableNumber: orderContext.tableNumber,
          roomId: orderContext.roomId,
          guestId: orderContext.guestId,
          bookingId: orderContext.bookingId,
          status: OrderStatus.pending,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          serviceCharge: totals.serviceCharge,
          discount: totals.discount,
          totalAmount: totals.totalAmount,
          notes: data.submitToKitchen ? data.notes?.trim() || null : markHeldNotes(data.notes),
          createdBy: req.user!.id,
          items: {
            create: data.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: priceByItemId.get(item.menuItemId)!,
              totalPrice: priceByItemId.get(item.menuItemId)! * item.quantity,
              specialInstructions: item.specialInstructions?.trim() || null,
            })),
          },
        },
      });

      const hydratedOrder = await getHydratedOrder(tx, createdOrder.id);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    logger.info(`Order created: ${result.orderNumber}`);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:id/items', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = appendRestaurantOrderItemsSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);
    const config = await readRestaurantConfig();
    const pricing = { taxRate: config.settings.taxRate, serviceChargeRate: config.settings.serviceChargeRate };

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              status: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      if (existingOrder.status === OrderStatus.completed || existingOrder.status === OrderStatus.cancelled) {
        throw new BadRequestError('Closed orders cannot be changed');
      }

      const priceByItemId = await loadAvailableMenuPrices(tx, data.items);

      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: priceByItemId.get(item.menuItemId)!,
          totalPrice: priceByItemId.get(item.menuItemId)! * item.quantity,
          specialInstructions: item.specialInstructions?.trim() || null,
          status: OrderItemStatus.pending,
        })),
      });

      const refreshedItems = await tx.orderItem.findMany({
        where: { orderId, status: { not: OrderItemStatus.cancelled } },
        select: {
          quantity: true,
          unitPrice: true,
          status: true,
        },
      });

      const totals = calculateRestaurantTotals(
        refreshedItems.map((item) => ({
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        pricing,
        Number(existingOrder.discount),
      );

      const currentlyHeld = isHeldNotes(existingOrder.notes);
      const nextHeld = currentlyHeld && !data.submitToKitchen;
      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          serviceCharge: totals.serviceCharge,
          discount: totals.discount,
          totalAmount: totals.totalAmount,
          notes: nextHeld
            ? markHeldNotes(combineNotes(unmarkHeldNotes(existingOrder.notes), data.notes))
            : combineNotes(unmarkHeldNotes(existingOrder.notes), data.notes),
          status: currentlyHeld && data.submitToKitchen ? OrderStatus.pending : existingOrder.status,
        },
      });

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/release', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        select: { id: true, notes: true, status: true },
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (!isHeldNotes(order.notes)) {
        throw new BadRequestError('This order is already live in the kitchen');
      }

      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: {
          notes: unmarkHeldNotes(order.notes),
          status: OrderStatus.pending,
        },
      });

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/status', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = updateRestaurantOrderStatusSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, notes: true },
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      if (existingOrder.status === OrderStatus.completed) {
        throw new BadRequestError('Completed orders cannot be changed');
      }

      if (isHeldNotes(existingOrder.notes)) {
        throw new BadRequestError('Held orders must be released before they can move through service');
      }

      if (status === OrderStatus.completed) {
        throw new BadRequestError('Use the payment endpoint to complete an order');
      }

      if (status === OrderStatus.cancelled) {
        throw new BadRequestError('Use the void approval flow to cancel a live order');
      }

      if (status !== OrderStatus.served) {
        throw new BadRequestError('Only served can be set manually');
      }

      await tx.orderItem.updateMany({
        where: {
          orderId,
          status: { not: OrderItemStatus.cancelled },
        },
        data: { status: OrderItemStatus.served },
      });

      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: { status },
      });

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:orderId/items/:itemId/status', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = updateRestaurantOrderItemStatusSchema.parse(req.body);
    const orderId = paramToInt(req.params.orderId);
    const itemId = paramToInt(req.params.itemId);

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, notes: true },
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      if (isHeldNotes(existingOrder.notes)) {
        throw new BadRequestError('Held orders cannot be changed in the kitchen');
      }

      if (existingOrder.status === OrderStatus.cancelled || existingOrder.status === OrderStatus.completed) {
        throw new BadRequestError('Closed orders cannot be changed in the kitchen');
      }

      const orderItem = await tx.orderItem.findFirst({
        where: { id: itemId, orderId },
        select: { id: true },
      });

      if (!orderItem) {
        throw new NotFoundError('Order item');
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { status },
      });

      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { status: true },
      });

      const nextStatus = deriveOrderStatus(orderItems.map((item) => item.status));
      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/payment', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentMethod, discount = 0, amountPaid, payments, notes } = updateRestaurantPaymentSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);
    const config = await readRestaurantConfig();
    const pricing = { taxRate: config.settings.taxRate, serviceChargeRate: config.settings.serviceChargeRate };

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            where: { status: { not: OrderItemStatus.cancelled } },
            select: {
              quantity: true,
              unitPrice: true,
              status: true,
            },
          },
          invoices: {
            include: { payments: true },
            orderBy: { id: 'desc' },
            take: 1,
          },
        },
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.status === OrderStatus.cancelled) {
        throw new BadRequestError('Cancelled orders cannot receive payments');
      }

      if (isHeldNotes(order.notes)) {
        throw new BadRequestError('Held orders must be sent to the kitchen before payment');
      }

      if (order.items.length === 0 || !order.items.every((item) => item.status === OrderItemStatus.served)) {
        throw new BadRequestError('Only served orders can receive payment');
      }

      const totals = calculateRestaurantTotals(
        order.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        pricing,
        discount,
      );

      const invoice = order.invoices[0] ?? null;
      const existingPaidAmount = invoice
        ? invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        : 0;
      const remainingBeforePayment = Math.max(totals.totalAmount - existingPaidAmount, 0);

      let incomingPayments: Array<{ paymentMethod: PaymentMethodType; amount: number; referenceNo?: string | null; notes?: string | null }> = [];
      let paymentSummaryMethod: PaymentMethodType | null = order.paymentMethod;

      if (payments && payments.length > 0) {
        incomingPayments = payments.map((payment) => ({
          paymentMethod: payment.paymentMethod as PaymentMethodType,
          amount: payment.amount,
          referenceNo: payment.referenceNo?.trim() || null,
          notes: payment.notes?.trim() || null,
        }));
        paymentSummaryMethod = incomingPayments[0]?.paymentMethod || null;
      } else if (paymentMethod === PaymentMethodType.room_charge) {
        paymentSummaryMethod = PaymentMethodType.room_charge;
      } else {
        if (!paymentMethod) {
          throw new BadRequestError('Select a payment method or enter payment splits');
        }

        if (!amountPaid || amountPaid <= 0) {
          throw new BadRequestError('Enter the amount received for this payment');
        }

        incomingPayments = [{
          paymentMethod,
          amount: amountPaid,
          referenceNo: null,
          notes: notes?.trim() || null,
        }];
        paymentSummaryMethod = paymentMethod;
      }

      if (paymentSummaryMethod !== PaymentMethodType.room_charge && incomingPayments.length === 0 && remainingBeforePayment > 0.001) {
        throw new BadRequestError('A non-room-charge order needs at least one payment entry');
      }

      const totalIncoming = incomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const nextPaidAmount = existingPaidAmount + totalIncoming;
      const nextPaymentStatus = derivePaymentStatus(totals.totalAmount, nextPaidAmount, paymentSummaryMethod);
      const nextInvoiceStatus = paymentSummaryMethod === PaymentMethodType.room_charge
        ? InvoiceStatus.issued
        : nextPaymentStatus === PaymentStatusType.paid
          ? InvoiceStatus.paid
          : nextPaymentStatus === PaymentStatusType.partial
            ? InvoiceStatus.partial
            : InvoiceStatus.issued;

      const ensuredInvoice = await ensureInvoiceForOrder(
        tx,
        orderId,
        totals,
        nextPaidAmount,
        nextInvoiceStatus,
        req.user!.id,
        notes,
      );

      if (incomingPayments.length > 0) {
        await tx.payment.createMany({
          data: incomingPayments.map((payment) => ({
            invoiceId: ensuredInvoice.id,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNo: payment.referenceNo || null,
            notes: payment.notes || null,
            receivedBy: req.user!.id,
          })),
        });
      }

      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: {
          paymentMethod: incomingPayments.length > 1 ? null : paymentSummaryMethod,
          paymentStatus: nextPaymentStatus,
          discount: totals.discount,
          taxAmount: totals.taxAmount,
          serviceCharge: totals.serviceCharge,
          totalAmount: totals.totalAmount,
          status: paymentSummaryMethod === PaymentMethodType.room_charge || nextPaymentStatus === PaymentStatusType.paid
            ? OrderStatus.completed
            : OrderStatus.served,
        },
      });

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/void-request', requireRole(...restaurantRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = requestRestaurantVoidSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, status: true, notes: true },
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      if (existingOrder.status === OrderStatus.completed) {
        throw new BadRequestError('Completed orders must use the refund flow instead of void');
      }

      if (existingOrder.status === OrderStatus.cancelled) {
        throw new BadRequestError('Order is already cancelled');
      }

      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: {
          notes: combineNotes(existingOrder.notes, `Void requested: ${reason.trim()}`),
        },
      });

      await createAuditLog(
        tx,
        req,
        'restaurant_order_void_requested',
        orderId,
        existingOrder,
        { reason: reason.trim(), requestedBy: req.user!.id },
      );

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/void-approve', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = requestRestaurantVoidSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, notes: true },
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      if (existingOrder.status === OrderStatus.completed) {
        throw new BadRequestError('Completed orders must use refund, not void approval');
      }

      if (existingOrder.status === OrderStatus.cancelled) {
        throw new BadRequestError('Order is already cancelled');
      }

      await tx.orderItem.updateMany({
        where: {
          orderId,
          status: { not: OrderItemStatus.cancelled },
        },
        data: { status: OrderItemStatus.cancelled },
      });

      await tx.restaurantOrder.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.cancelled,
          notes: combineNotes(existingOrder.notes, `Void approved: ${reason.trim()}`),
        },
      });

      await createAuditLog(
        tx,
        req,
        'restaurant_order_void_approved',
        orderId,
        existingOrder,
        { reason: reason.trim(), approvedBy: req.user!.id },
      );

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:id/refund', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, reason } = createRestaurantRefundSchema.parse(req.body);
    const orderId = paramToInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.restaurantOrder.findUnique({
        where: { id: orderId },
        include: {
          invoices: {
            include: { payments: true },
            orderBy: { id: 'desc' },
            take: 1,
          },
        },
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.status !== OrderStatus.completed) {
        throw new BadRequestError('Only completed orders can be refunded');
      }

      const invoice = order.invoices[0] ?? null;
      const paidAmount = invoice
        ? invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        : 0;

      if (amount > paidAmount + 0.001) {
        throw new BadRequestError('Refund amount exceeds the paid balance on this order');
      }

      if (invoice) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            notes: combineNotes(invoice.notes, `Refund recorded: ${amount.toFixed(2)} LKR - ${reason.trim()}`),
          },
        });
      }

      await createAuditLog(
        tx,
        req,
        'restaurant_order_refunded',
        orderId,
        { paidAmount },
        { refundAmount: amount, reason: reason.trim() },
      );

      const hydratedOrder = await getHydratedOrder(tx, orderId);
      if (!hydratedOrder) {
        throw new NotFoundError('Order');
      }

      return hydratedOrder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/kitchen', requireRole(...restaurantRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.restaurantOrder.findMany({
      where: { status: { in: [OrderStatus.pending, OrderStatus.preparing, OrderStatus.ready] } },
      include: {
        room: { select: { roomNumber: true } },
        guest: { select: { firstName: true, lastName: true } },
        creator: { select: { fullName: true, username: true } },
        items: {
          where: { status: { not: OrderItemStatus.cancelled } },
          include: { menuItem: { select: { name: true, preparationTime: true } } },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(orders.filter((order) => !isHeldNotes(order.notes)));
  } catch (error) {
    next(error);
  }
});

router.get('/meal-plans', requireRole(...restaurantRoles), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.mealPlan.findMany({
      where: { isActive: true },
      orderBy: [{ mealType: 'asc' }, { price: 'asc' }],
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

router.post('/meal-plans', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMealPlanSchema.parse(req.body);
    const plan = await prisma.mealPlan.create({
      data: {
        name: data.name,
        mealType: data.mealType.replace('-', '_') as any,
        price: data.price,
        description: data.description,
        menuItems: data.menuItems || [],
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

router.put('/meal-plans/:id', requireRole(...managerRoles), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMealPlanSchema.parse(req.body);
    const plan = await prisma.mealPlan.update({
      where: { id: paramToInt(req.params.id) },
      data: {
        name: data.name,
        mealType: data.mealType.replace('-', '_') as any,
        price: data.price,
        description: data.description,
        menuItems: data.menuItems || [],
      },
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

export default router;

















