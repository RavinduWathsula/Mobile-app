import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const distRoot = path.resolve(process.cwd(), 'dist');
const appModule = await import(pathToFileURL(path.join(distRoot, 'app.js')).href);
const prismaModule = await import(pathToFileURL(path.join(distRoot, 'config', 'database.js')).href);
const authModule = await import(pathToFileURL(path.join(distRoot, 'middleware', 'auth.js')).href);

const { createApp } = appModule;
const prisma = prismaModule.default;
const { generateAccessToken } = authModule;

const restaurantConfigPath = path.resolve(process.cwd(), 'data', 'restaurant-config.json');

function unexpected(name) {
  return async () => {
    throw new Error(`Unexpected prisma call: ${name}`);
  };
}

function resetPrismaMocks() {
  prisma.$queryRaw = unexpected('$queryRaw');
  prisma.$transaction = unexpected('$transaction');

  prisma.user.findFirst = unexpected('user.findFirst');
  prisma.user.findUnique = unexpected('user.findUnique');
  prisma.user.findMany = unexpected('user.findMany');
  prisma.user.count = unexpected('user.count');
  prisma.user.create = unexpected('user.create');
  prisma.user.update = unexpected('user.update');

  prisma.refreshToken.findMany = unexpected('refreshToken.findMany');
  prisma.refreshToken.findUnique = unexpected('refreshToken.findUnique');
  prisma.refreshToken.create = unexpected('refreshToken.create');
  prisma.refreshToken.delete = unexpected('refreshToken.delete');
  prisma.refreshToken.deleteMany = unexpected('refreshToken.deleteMany');

  prisma.roomType.findUnique = unexpected('roomType.findUnique');
  prisma.roomType.findMany = unexpected('roomType.findMany');
  prisma.room.findUnique = unexpected('room.findUnique');
  prisma.room.findMany = unexpected('room.findMany');
  prisma.room.count = unexpected('room.count');
  prisma.room.update = unexpected('room.update');

  prisma.booking.findFirst = unexpected('booking.findFirst');
  prisma.booking.findUnique = unexpected('booking.findUnique');
  prisma.booking.findMany = unexpected('booking.findMany');
  prisma.booking.count = unexpected('booking.count');
  prisma.booking.groupBy = unexpected('booking.groupBy');
  prisma.booking.create = unexpected('booking.create');
  prisma.booking.update = unexpected('booking.update');
  prisma.reservationGroup.create = unexpected('reservationGroup.create');

  prisma.mealPlan.findMany = unexpected('mealPlan.findMany');
  prisma.menuCategory.findMany = unexpected('menuCategory.findMany');
  prisma.menuCategory.create = unexpected('menuCategory.create');
  prisma.menuCategory.update = unexpected('menuCategory.update');
  prisma.menuCategory.delete = unexpected('menuCategory.delete');
  prisma.menuItem.findMany = unexpected('menuItem.findMany');
  prisma.menuItem.create = unexpected('menuItem.create');
  prisma.menuItem.update = unexpected('menuItem.update');
  prisma.restaurantOrder.findMany = unexpected('restaurantOrder.findMany');
  prisma.restaurantOrder.findUnique = unexpected('restaurantOrder.findUnique');
  prisma.restaurantOrder.count = unexpected('restaurantOrder.count');
  prisma.restaurantOrder.create = unexpected('restaurantOrder.create');
  prisma.restaurantOrder.update = unexpected('restaurantOrder.update');
  prisma.invoice.findFirst = unexpected('invoice.findFirst');
  prisma.invoice.create = unexpected('invoice.create');
  prisma.invoice.update = unexpected('invoice.update');
  prisma.payment.create = unexpected('payment.create');
  prisma.payment.createMany = unexpected('payment.createMany');
  prisma.auditLog.create = unexpected('auditLog.create');
  prisma.orderItem.findFirst = unexpected('orderItem.findFirst');
  prisma.orderItem.findMany = unexpected('orderItem.findMany');
  prisma.orderItem.update = unexpected('orderItem.update');
  prisma.orderItem.updateMany = unexpected('orderItem.updateMany');

  prisma.guest.findUnique = unexpected('guest.findUnique');
  prisma.guest.create = unexpected('guest.create');
  prisma.guest.update = unexpected('guest.update');
  prisma.bookingMeal.deleteMany = unexpected('bookingMeal.deleteMany');
  prisma.bookingMeal.createMany = unexpected('bookingMeal.createMany');
}

function createToken(role) {
  return generateAccessToken({
    id: 99,
    email: `${role.toLowerCase().replace(/\s+/g, '.')}@sawingir.com`,
    username: role.toLowerCase().replace(/\s+/g, ''),
    role,
    roleId: 1,
  });
}

async function run() {
  const originalRestaurantConfig = await fs.readFile(restaurantConfigPath, 'utf8').catch(() => null);
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tests = [
    {
      name: 'auth login returns access token and refresh cookie',
      run: async () => {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.default.hash('Admin@123', 4);

        prisma.user.findFirst = async () => ({
          id: 1,
          fullName: 'Admin User',
          email: 'admin@sawingir.com',
          username: 'admin',
          passwordHash,
          roleId: 1,
          status: 'active',
          department: 'Admin',
          avatarUrl: null,
          role: { id: 1, name: 'Administrator' },
        });
        prisma.user.update = async () => ({ id: 1 });
        prisma.refreshToken.findMany = async () => [];
        prisma.refreshToken.create = async () => ({ id: 1 });

        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
        });

        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.user.username, 'admin');
        assert.ok(body.accessToken);
        const setCookie = response.headers.get('set-cookie') || '';
        assert.match(setCookie, /refreshToken=/);
        assert.match(setCookie, /HttpOnly/i);
      },
    },
    {
      name: 'admin users endpoint rejects front office role',
      run: async () => {
        const response = await fetch(`${baseUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${createToken('Front Office')}` },
        });

        assert.equal(response.status, 403);
        const body = await response.json();
        assert.match(body.message, /Requires one of/i);
      },
    },
    {
      name: 'restaurant staff can read live menu and kitchen orders',
      run: async () => {
        prisma.menuItem.findMany = async () => [];
        prisma.restaurantOrder.findMany = async () => [];

        const menuResponse = await fetch(`${baseUrl}/api/restaurant/menu`, {
          headers: { Authorization: `Bearer ${createToken('Restaurant Staff')}` },
        });
        const kitchenResponse = await fetch(`${baseUrl}/api/restaurant/kitchen`, {
          headers: { Authorization: `Bearer ${createToken('Restaurant Staff')}` },
        });

        assert.equal(menuResponse.status, 200);
        assert.equal(kitchenResponse.status, 200);
      },
    },
    {
      name: 'front office role is rejected from restaurant routes',
      run: async () => {
        const response = await fetch(`${baseUrl}/api/restaurant/kitchen`, {
          headers: { Authorization: `Bearer ${createToken('Front Office')}` },
        });

        assert.equal(response.status, 403);
        const body = await response.json();
        assert.match(body.message, /Requires one of/i);
      },
    },
    {
      name: 'booking endpoint blocks fully reserved room types',
      run: async () => {
        prisma.roomType.findUnique = async () => ({
          id: 2,
          name: 'Double Room',
          basePrice: 12000,
          maxOccupancy: 2,
          isActive: true,
        });
        prisma.room.count = async () => 1;
        prisma.booking.count = async () => 1;

        const response = await fetch(`${baseUrl}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Front Office')}`,
          },
          body: JSON.stringify({
            guest: {
              firstName: 'Demo',
              lastName: 'Guest',
              email: 'demo.guest@example.com',
              phone: '+94770000000',
              nationality: 'LK',
              idNumber: '901234567V',
            },
            roomTypeId: 2,
            checkIn: '2026-07-10',
            checkOut: '2026-07-12',
            nights: 2,
            adults: 2,
            children: 0,
            mealPlan: 'bnb',
            source: 'direct',
            additionalMeals: [],
          }),
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.match(body.message, /No rooms of the selected type are available/i);
      },
    },
    {
      name: 'group reservation create links multiple rooms under one guest stay',
      run: async () => {
        let reservationGroupPayload;
        const bookingCreates = [];

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.room.count = async ({ where }) => (where.roomTypeId === 2 ? 3 : 2);
        prisma.booking.count = async () => 0;
        prisma.roomType.findUnique = async ({ where }) => ({
          id: where.id,
          name: where.id === 2 ? 'Double Room' : 'Family Room',
          basePrice: where.id === 2 ? 12000 : 18000,
          maxOccupancy: where.id === 2 ? 2 : 4,
          isActive: true,
        });
        prisma.guest.create = async () => ({ id: 41 });
        prisma.reservationGroup.create = async ({ data }) => {
          reservationGroupPayload = data;
          return { id: 91, groupRef: data.groupRef, guestId: data.guestId };
        };
        prisma.booking.create = async ({ data }) => {
          const created = { id: 600 + bookingCreates.length + 1, ...data };
          bookingCreates.push(created);
          return { id: created.id };
        };
        prisma.bookingMeal.deleteMany = async () => ({ count: 0 });
        prisma.bookingMeal.createMany = async () => ({ count: 0 });
        prisma.booking.findUnique = async ({ where }) => {
          const booking = bookingCreates.find((entry) => entry.id === where.id);
          if (!booking) return null;

          return {
            id: booking.id,
            bookingRef: booking.bookingRef,
            guest: {
              id: 41,
              firstName: 'Group',
              lastName: 'Guest',
              email: 'group@example.com',
              phone: '+94770000001',
              nationality: 'LK',
              idNumber: '987654321V',
            },
            reservationGroup: { id: 91, groupRef: reservationGroupPayload.groupRef },
            room: null,
            roomType: {
              id: booking.roomTypeId,
              name: booking.roomTypeId === 2 ? 'Double Room' : 'Family Room',
            },
            bookingMeals: [],
            invoices: [],
            groupId: 91,
            roomId: null,
            roomTypeId: booking.roomTypeId,
            checkIn: new Date('2026-07-20'),
            checkOut: new Date('2026-07-22'),
            nights: 2,
            adults: booking.adults,
            children: booking.children,
            mealPlan: booking.mealPlan,
            roomRate: booking.roomRate,
            subtotal: booking.subtotal,
            taxAmount: booking.taxAmount,
            serviceCharge: booking.serviceCharge,
            totalAmount: booking.totalAmount,
            advancePaid: booking.advancePaid,
            balanceDue: booking.balanceDue,
            status: 'confirmed',
          };
        };
        prisma.booking.findMany = async ({ where }) => bookingCreates
          .filter((entry) => entry.groupId === where.groupId)
          .map((entry) => ({
            id: entry.id,
            bookingRef: entry.bookingRef,
            groupId: entry.groupId,
            totalAmount: entry.totalAmount,
            advancePaid: entry.advancePaid,
            balanceDue: entry.balanceDue,
            room: null,
            roomType: {
              id: entry.roomTypeId,
              name: entry.roomTypeId === 2 ? 'Double Room' : 'Family Room',
            },
          }));

        const response = await fetch(`${baseUrl}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Front Office')}`,
          },
          body: JSON.stringify({
            guest: {
              firstName: 'Group',
              lastName: 'Guest',
              email: 'group@example.com',
              phone: '+94770000001',
              nationality: 'LK',
              idNumber: '987654321V',
            },
            checkIn: '2026-07-20',
            checkOut: '2026-07-22',
            nights: 2,
            source: 'direct',
            specialRequests: 'Adjacent rooms if possible',
            rooms: [
              { roomTypeId: 2, adults: 2, children: 0, mealPlan: 'bnb', additionalMeals: [] },
              { roomTypeId: 3, adults: 2, children: 2, mealPlan: 'room-only', additionalMeals: [] },
            ],
          }),
        });

        assert.equal(response.status, 201);
        const body = await response.json();
        assert.equal(bookingCreates.length, 2);
        assert.equal(reservationGroupPayload.guestId, 41);
        assert.match(reservationGroupPayload.groupRef, /^GRP-/);
        assert.ok(bookingCreates.every((entry) => entry.groupId === 91));
        assert.equal(body.groupSummary.roomsCount, 2);
        assert.match(body.groupSummary.groupRef, /^GRP-/);
      },
    },
    {
      name: 'check-in requires an assigned room',
      run: async () => {
        prisma.$transaction = async (callback) => callback(prisma);
        prisma.booking.findUnique = async () => ({
          id: 17,
          bookingRef: 'BK-17',
          guestId: 4,
          roomId: null,
          roomTypeId: 2,
          status: 'confirmed',
          notes: null,
          checkIn: new Date('2026-07-10'),
          checkOut: new Date('2026-07-12'),
          balanceDue: 0,
        });

        const response = await fetch(baseUrl + '/api/bookings/17/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + createToken('Front Office'),
          },
          body: JSON.stringify({ status: 'checked_in' }),
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.match(body.message, /Assign a room before check-in/i);
      },
    },
    {
      name: 'check-in accepts a provided room assignment',
      run: async () => {
        let roomUpdatedTo = null;
        let bookingUpdatedWith = null;

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.booking.findUnique = async () => ({
          id: 18,
          bookingRef: 'BK-18',
          guestId: 5,
          roomId: null,
          roomTypeId: 2,
          status: 'confirmed',
          notes: null,
          checkIn: new Date('2026-07-10'),
          checkOut: new Date('2026-07-12'),
          balanceDue: 0,
        });
        prisma.room.findUnique = async () => ({ id: 301, roomNumber: '301', roomTypeId: 2, status: 'available', isActive: true });
        prisma.booking.findFirst = async () => null;
        prisma.room.update = async ({ data }) => {
          roomUpdatedTo = data.status;
          return { id: 301, status: data.status };
        };
        prisma.booking.update = async ({ data }) => {
          bookingUpdatedWith = data;
          return { id: 18, bookingRef: 'BK-18', status: data.status, roomId: data.roomId };
        };

        const response = await fetch(baseUrl + '/api/bookings/18/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + createToken('Front Office'),
          },
          body: JSON.stringify({ status: 'checked_in', roomId: 301 }),
        });

        assert.equal(response.status, 200);
        assert.equal(roomUpdatedTo, 'occupied');
        assert.equal(bookingUpdatedWith.roomId, 301);
      },
    },
    {
      name: 'checkout is blocked while a balance is still due',
      run: async () => {
        prisma.$transaction = async (callback) => callback(prisma);
        prisma.booking.findUnique = async () => ({
          id: 19,
          bookingRef: 'BK-19',
          guestId: 6,
          roomId: 302,
          roomTypeId: 2,
          status: 'checked_in',
          notes: null,
          checkIn: new Date('2026-07-08'),
          checkOut: new Date('2026-07-10'),
          balanceDue: 1200,
        });

        const response = await fetch(baseUrl + '/api/bookings/19/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + createToken('Front Office'),
          },
          body: JSON.stringify({ status: 'checked_out' }),
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.match(body.message, /Settle the outstanding balance before checkout/i);
      },
    },
    {
      name: 'booking payment patch updates advance paid and balance due',
      run: async () => {
        let bookingPaymentUpdate;
        let paymentCreatePayload;

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.booking.findUnique = async () => ({
          id: 20,
          bookingRef: 'BK-20',
          guestId: 7,
          status: 'confirmed',
          subtotal: 10000,
          taxAmount: 1200,
          serviceCharge: 1000,
          totalAmount: 12200,
          advancePaid: 2000,
          balanceDue: 10200,
        });
        prisma.invoice.findFirst = async () => null;
        prisma.invoice.create = async ({ data }) => ({ id: 41, paidAmount: data.paidAmount, notes: data.notes });
        prisma.payment.create = async ({ data }) => {
          paymentCreatePayload = data;
          return { id: 81, ...data };
        };
        prisma.booking.update = async ({ data }) => {
          bookingPaymentUpdate = data;
          return { id: 20, bookingRef: 'BK-20', ...data };
        };

        const response = await fetch(baseUrl + '/api/bookings/20/payment', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + createToken('Front Office'),
          },
          body: JSON.stringify({
            amount: 2200,
            paymentMethod: 'card',
            referenceNo: 'FO-2200',
            notes: 'Deposit taken at desk',
          }),
        });

        assert.equal(response.status, 200);
        assert.equal(paymentCreatePayload.paymentMethod, 'card');
        assert.equal(bookingPaymentUpdate.advancePaid, 4200);
        assert.equal(bookingPaymentUpdate.balanceDue, 8000);
      },
    },
    {
      name: 'table order creation requires table number',
      run: async () => {
        prisma.$transaction = async (callback) => callback(prisma);

        const response = await fetch(`${baseUrl}/api/restaurant/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Restaurant Staff')}`,
          },
          body: JSON.stringify({
            orderType: 'dine_in',
            items: [{ menuItemId: 10, quantity: 1 }],
          }),
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.match(body.message, /Table orders require a table number/i);
      },
    },
    {
      name: 'room-service creation fails when booking and guest linkage is invalid',
      run: async () => {
        prisma.$transaction = async (callback) => callback(prisma);
        prisma.booking.findUnique = async () => ({
          id: 33,
          status: 'checked_in',
          roomId: 201,
          guestId: 12,
        });

        const response = await fetch(`${baseUrl}/api/restaurant/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Restaurant Staff')}`,
          },
          body: JSON.stringify({
            orderType: 'room_service',
            bookingId: 33,
            roomId: 201,
            guestId: 999,
            items: [{ menuItemId: 10, quantity: 1 }],
          }),
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.match(body.message, /guest does not match the booking/i);
      },
    },
    {
      name: 'restaurant totals are server calculated and ignore client price manipulation',
      run: async () => {
        let createPayload;
        let findUniqueCalls = 0;

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.menuItem.findMany = async () => [{ id: 55, price: 1200 }];
        prisma.restaurantOrder.create = async ({ data }) => {
          createPayload = data;
          return { id: 44, orderNumber: data.orderNumber };
        };
        prisma.restaurantOrder.findUnique = async () => {
          findUniqueCalls += 1;
          if (findUniqueCalls === 1) {
            return {
              id: 44,
              orderNumber: createPayload.orderNumber,
              status: 'pending',
              room: null,
              guest: null,
              booking: null,
              items: [
                {
                  id: 1,
                  quantity: 2,
                  status: 'pending',
                  menuItem: { name: 'Soup', categoryId: 1, preparationTime: 10, isAvailable: true },
                },
              ],
            };
          }
          return null;
        };

        const response = await fetch(`${baseUrl}/api/restaurant/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Restaurant Staff')}`,
          },
          body: JSON.stringify({
            orderType: 'dine_in',
            tableNumber: '1',
            items: [{ menuItemId: 55, quantity: 2, price: 1 }],
          }),
        });

        assert.equal(response.status, 201);
        assert.equal(createPayload.subtotal, 2400);
        assert.equal(createPayload.items.create[0].unitPrice, 1200);
      },
    },
    {
      name: 'restaurant public menu exposes live settings without auth',
      run: async () => {
        prisma.menuCategory.findMany = async () => ([
          { id: 1, name: 'Starters', description: null, sortOrder: 1, isActive: true, _count: { items: 1 } },
        ]);
        prisma.menuItem.findMany = async () => ([
          { id: 10, categoryId: 1, name: 'Mix Green Salad', price: 650, preparationTime: 8, isVegetarian: true, isSpicy: false, isAvailable: true, imageUrl: null, category: { id: 1, name: 'Starters' } },
        ]);

        const response = await fetch(`${baseUrl}/api/restaurant/public-menu`);

        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.settings.publicMenuPath, '/qr-menu');
        assert.equal(body.categories[0].name, 'Starters');
        assert.equal(body.items[0].name, 'Mix Green Salad');
      },
    },
    {
      name: 'manager can update restaurant settings and table configuration',
      run: async () => {
        prisma.restaurantOrder.findMany = async () => [];

        const settingsResponse = await fetch(`${baseUrl}/api/restaurant/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Manager')}`,
          },
          body: JSON.stringify({
            taxRate: 0.12,
            serviceChargeRate: 0.05,
            modifierPresets: ['No sugar', 'Extra hot'],
            publicMenuTitle: 'QA Menu',
          }),
        });

        assert.equal(settingsResponse.status, 200);
        const settingsBody = await settingsResponse.json();
        assert.equal(settingsBody.taxRate, 0.12);
        assert.equal(settingsBody.publicMenuTitle, 'QA Menu');

        const createTableResponse = await fetch(`${baseUrl}/api/restaurant/tables`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Manager')}`,
          },
          body: JSON.stringify({
            code: 'QA-1',
            name: 'QA Table',
            area: 'Test Deck',
            capacity: 4,
            sortOrder: 90,
            isActive: true,
          }),
        });

        assert.equal(createTableResponse.status, 201);
        const createdTable = await createTableResponse.json();
        assert.equal(createdTable.code, 'QA-1');

        const updateTableResponse = await fetch(`${baseUrl}/api/restaurant/tables/${createdTable.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Manager')}`,
          },
          body: JSON.stringify({ name: 'QA Table Renamed', sortOrder: 91 }),
        });

        assert.equal(updateTableResponse.status, 200);
        const updatedTable = await updateTableResponse.json();
        assert.equal(updatedTable.name, 'QA Table Renamed');

        const deleteTableResponse = await fetch(`${baseUrl}/api/restaurant/tables/${createdTable.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${createToken('Manager')}` },
        });

        assert.equal(deleteTableResponse.status, 204);
      },
    },
    {
      name: 'manager can update and delete restaurant categories',
      run: async () => {
        prisma.menuCategory.update = async ({ where, data }) => ({ id: where.id, name: data.name ?? 'Updated category', description: data.description ?? null, sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true });
        prisma.menuItem.findMany = async () => [];
        prisma.menuCategory.delete = async ({ where }) => ({ id: where.id });

        const updateResponse = await fetch(`${baseUrl}/api/restaurant/categories/77`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Manager')}`,
          },
          body: JSON.stringify({ name: 'Updated Starters', isActive: true }),
        });

        assert.equal(updateResponse.status, 200);
        const updatedCategory = await updateResponse.json();
        assert.equal(updatedCategory.name, 'Updated Starters');

        const deleteResponse = await fetch(`${baseUrl}/api/restaurant/categories/77`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${createToken('Manager')}` },
        });

        assert.equal(deleteResponse.status, 204);
      },
    },
    {
      name: 'item status progression updates the parent order status',
      run: async () => {
        let findOrderCalls = 0;
        let updatedStatus = null;

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.restaurantOrder.findUnique = async () => {
          findOrderCalls += 1;
          if (findOrderCalls === 1) {
            return { id: 71, status: 'pending' };
          }
          return {
            id: 71,
            orderNumber: 'ORD-71',
            status: updatedStatus,
            room: null,
            guest: null,
            booking: null,
            items: [
              {
                id: 8,
                quantity: 1,
                status: 'preparing',
                menuItem: { name: 'Club Sandwich', categoryId: 1, preparationTime: 12, isAvailable: true },
              },
            ],
          };
        };
        prisma.orderItem.findFirst = async () => ({ id: 8 });
        prisma.orderItem.update = async () => ({ id: 8, status: 'preparing' });
        prisma.orderItem.findMany = async () => [{ status: 'preparing' }, { status: 'ready' }];
        prisma.restaurantOrder.update = async ({ data }) => {
          updatedStatus = data.status;
          return { id: 71, status: data.status };
        };

        const response = await fetch(`${baseUrl}/api/restaurant/orders/71/items/8/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Restaurant Staff')}`,
          },
          body: JSON.stringify({ status: 'preparing' }),
        });

        assert.equal(response.status, 200);
        assert.equal(updatedStatus, 'preparing');
      },
    },
    {
      name: 'payment patch persists payment method and payment status',
      run: async () => {
        let findOrderCalls = 0;
        let paymentUpdate;

        prisma.$transaction = async (callback) => callback(prisma);
        prisma.restaurantOrder.findUnique = async () => {
          findOrderCalls += 1;
          if (findOrderCalls === 1) {
            return {
              id: 88,
              status: 'served',
              paymentMethod: null,
              paymentStatus: 'unpaid',
              items: [
                { quantity: 2, unitPrice: 1000, status: 'served' },
              ],
              invoices: [],
            };
          }

          return {
            id: 88,
            orderNumber: 'ORD-88',
            status: 'completed',
            room: null,
            guest: null,
            booking: null,
            items: [
              {
                id: 1,
                quantity: 2,
                status: 'served',
                menuItem: { name: 'Chicken Kottu', categoryId: 2, preparationTime: 18, isAvailable: true },
              },
            ],
          };
        };
        prisma.invoice.findFirst = async () => null;
        prisma.invoice.create = async ({ data }) => ({ id: 501, ...data });
        prisma.payment.createMany = async () => ({ count: 1 });
        prisma.payment.create = async () => ({ id: 1 });
        prisma.restaurantOrder.update = async ({ data }) => {
          paymentUpdate = data;
          return { id: 88, ...data };
        };

        const response = await fetch(`${baseUrl}/api/restaurant/orders/88/payment`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken('Restaurant Staff')}`,
          },
          body: JSON.stringify({
            paymentMethod: 'card',
            paymentStatus: 'paid',
            discount: 100,
            amountPaid: 2300,
          }),
        });

        assert.equal(response.status, 200);
        assert.equal(paymentUpdate.paymentMethod, 'card');
        assert.equal(paymentUpdate.paymentStatus, 'paid');
        assert.equal(paymentUpdate.status, 'completed');
      },
    },
  ];

  try {
    for (const currentTest of tests) {
      resetPrismaMocks();
      await currentTest.run();
      console.log(`PASS ${currentTest.name}`);
    }

    console.log(`Passed ${tests.length} backend route checks.`);
  } finally {
    if (originalRestaurantConfig !== null) {
      await fs.writeFile(restaurantConfigPath, originalRestaurantConfig, 'utf8');
    }
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

try {
  await run();
} catch (error) {
  console.error('Backend route checks failed.');
  console.error(error);
  process.exit(1);
}











