import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateBookingPricing } from '../src/utils/pricing.js';

const prisma = new PrismaClient();
const RESTAURANT_TAX_RATE = 0.1;
const RESTAURANT_SERVICE_RATE = 0.1;

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function calculateRestaurantTotals(lines: Array<{ quantity: number; unitPrice: number }>, discount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  const appliedDiscount = Math.min(Math.max(discount, 0), subtotal);
  const taxableSubtotal = subtotal - appliedDiscount;
  const taxAmount = taxableSubtotal * RESTAURANT_TAX_RATE;
  const serviceCharge = taxableSubtotal * RESTAURANT_SERVICE_RATE;
  const totalAmount = taxableSubtotal + taxAmount + serviceCharge;

  return {
    subtotal,
    discount: appliedDiscount,
    taxAmount,
    serviceCharge,
    totalAmount,
  };
}

async function upsertMealPlan(plan: {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'event-package';
  price: number;
  description: string;
  menuItems: string[];
}) {
  const existing = await prisma.mealPlan.findFirst({ where: { name: plan.name } });

  if (existing) {
    return prisma.mealPlan.update({
      where: { id: existing.id },
      data: {
        mealType: plan.mealType as any,
        price: plan.price,
        description: plan.description,
        menuItems: plan.menuItems,
        isActive: true,
      },
    });
  }

  return prisma.mealPlan.create({
    data: {
      name: plan.name,
      mealType: plan.mealType as any,
      price: plan.price,
      description: plan.description,
      menuItems: plan.menuItems,
      isActive: true,
    },
  });
}

async function upsertMenuCategory(category: {
  name: string;
  description: string;
  sortOrder: number;
}) {
  const existing = await prisma.menuCategory.findFirst({ where: { name: category.name } });

  if (existing) {
    return prisma.menuCategory.update({
      where: { id: existing.id },
      data: {
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  return prisma.menuCategory.create({
    data: {
      ...category,
      isActive: true,
    },
  });
}

async function upsertMenuItem(item: {
  name: string;
  categoryId: number;
  description: string;
  price: number;
  preparationTime: number;
  sortOrder: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  imageUrl?: string;
}) {
  const existing = await prisma.menuItem.findFirst({ where: { name: item.name, categoryId: item.categoryId } });

  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data: {
        categoryId: item.categoryId,
        description: item.description,
        price: item.price,
        preparationTime: item.preparationTime,
        sortOrder: item.sortOrder,
        isVegetarian: item.isVegetarian ?? false,
        isSpicy: item.isSpicy ?? false,
        imageUrl: item.imageUrl,
        isAvailable: true,
      },
    });
  }

  return prisma.menuItem.create({
    data: {
      ...item,
      isVegetarian: item.isVegetarian ?? false,
      isSpicy: item.isSpicy ?? false,
      isAvailable: true,
    },
  });
}

async function upsertGuest(guest: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  idNumber: string;
  totalStays?: number;
  totalSpent?: number;
}) {
  const existing = await prisma.guest.findFirst({ where: { email: guest.email } });

  if (existing) {
    return prisma.guest.update({
      where: { id: existing.id },
      data: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
        nationality: guest.nationality,
        idNumber: guest.idNumber,
        totalStays: guest.totalStays ?? existing.totalStays,
        totalSpent: guest.totalSpent ?? existing.totalSpent,
      },
    });
  }

  return prisma.guest.create({
    data: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      nationality: guest.nationality,
      idNumber: guest.idNumber,
      totalStays: guest.totalStays ?? 0,
      totalSpent: guest.totalSpent ?? 0,
    },
  });
}

async function upsertRestaurantOrder(seed: {
  orderNumber: string;
  orderType: 'dine_in' | 'room_service';
  tableNumber?: string | null;
  roomId?: number | null;
  guestId?: number | null;
  bookingId?: number | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  notes?: string | null;
  createdBy: number;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'room_charge' | null;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  discount?: number;
  items: Array<{
    menuItemId: number;
    quantity: number;
    unitPrice: number;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    specialInstructions?: string | null;
  }>;
}) {
  const totals = calculateRestaurantTotals(
    seed.items.map((item) => ({ quantity: item.quantity, unitPrice: item.unitPrice })),
    seed.discount ?? 0,
  );

  const order = await prisma.restaurantOrder.upsert({
    where: { orderNumber: seed.orderNumber },
    update: {
      orderType: seed.orderType as any,
      tableNumber: seed.tableNumber ?? null,
      roomId: seed.roomId ?? null,
      guestId: seed.guestId ?? null,
      bookingId: seed.bookingId ?? null,
      status: seed.status as any,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      serviceCharge: totals.serviceCharge,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentMethod: seed.paymentMethod ? seed.paymentMethod as any : null,
      paymentStatus: (seed.paymentStatus ?? 'unpaid') as any,
      notes: seed.notes ?? null,
      createdBy: seed.createdBy,
    },
    create: {
      orderNumber: seed.orderNumber,
      orderType: seed.orderType as any,
      tableNumber: seed.tableNumber ?? null,
      roomId: seed.roomId ?? null,
      guestId: seed.guestId ?? null,
      bookingId: seed.bookingId ?? null,
      status: seed.status as any,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      serviceCharge: totals.serviceCharge,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentMethod: seed.paymentMethod ? seed.paymentMethod as any : null,
      paymentStatus: (seed.paymentStatus ?? 'unpaid') as any,
      notes: seed.notes ?? null,
      createdBy: seed.createdBy,
    },
  });

  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.orderItem.createMany({
    data: seed.items.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      specialInstructions: item.specialInstructions ?? null,
      status: item.status as any,
    })),
  });

  return order;
}

async function main() {
  console.log('Seeding Sawingir Hills demo data...');

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Administrator' },
      update: { description: 'Full system access', permissions: { all: true }, isActive: true },
      create: { name: 'Administrator', description: 'Full system access', permissions: { all: true } },
    }),
    prisma.role.upsert({
      where: { name: 'Manager' },
      update: { description: 'Manage live hotel operations', permissions: { dashboard: true, bookings: true, rooms: true, reports: true, users: true }, isActive: true },
      create: { name: 'Manager', description: 'Manage live hotel operations', permissions: { dashboard: true, bookings: true, rooms: true, reports: true, users: true } },
    }),
    prisma.role.upsert({
      where: { name: 'Front Office' },
      update: { description: 'Reservations, check-ins, and check-outs', permissions: { dashboard: true, bookings: true, arrivals: true, checkouts: true }, isActive: true },
      create: { name: 'Front Office', description: 'Reservations, check-ins, and check-outs', permissions: { dashboard: true, bookings: true, arrivals: true, checkouts: true } },
    }),
    prisma.role.upsert({
      where: { name: 'Housekeeping' },
      update: { description: 'Room cleaning and maintenance', permissions: { housekeeping: true, rooms: { view: true } }, isActive: true },
      create: { name: 'Housekeeping', description: 'Room cleaning and maintenance', permissions: { housekeeping: true, rooms: { view: true } } },
    }),
    prisma.role.upsert({
      where: { name: 'Restaurant Staff' },
      update: { description: 'Restaurant operations', permissions: { restaurant: true }, isActive: true },
      create: { name: 'Restaurant Staff', description: 'Restaurant operations', permissions: { restaurant: true } },
    }),
  ]);
  console.log(`  roles: ${roles.length}`);

  const passwordHashes = {
    admin: await bcrypt.hash('Admin@123', 12),
    dev: await bcrypt.hash('Dev@123', 12),
    manager: await bcrypt.hash('Manager@123', 12),
    frontoffice: await bcrypt.hash('FrontOffice@123', 12),
    restaurantstaff: await bcrypt.hash('Restaurant@123', 12),
  };

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      fullName: 'Admin User',
      email: 'admin@sawingir.com',
      passwordHash: passwordHashes.admin,
      department: 'Admin',
      roleId: roles[0].id,
      status: 'active',
    },
    create: {
      fullName: 'Admin User',
      email: 'admin@sawingir.com',
      username: 'admin',
      passwordHash: passwordHashes.admin,
      department: 'Admin',
      roleId: roles[0].id,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { username: 'dev' },
    update: {
      fullName: 'Developer Access',
      email: 'dev@sawingir.com',
      passwordHash: passwordHashes.dev,
      department: 'Admin',
      roleId: roles[0].id,
      status: 'active',
    },
    create: {
      fullName: 'Developer Access',
      email: 'dev@sawingir.com',
      username: 'dev',
      passwordHash: passwordHashes.dev,
      department: 'Admin',
      roleId: roles[0].id,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {
      fullName: 'Manager Demo',
      email: 'manager@sawingir.com',
      passwordHash: passwordHashes.manager,
      department: 'Manager',
      roleId: roles[1].id,
      status: 'active',
    },
    create: {
      fullName: 'Manager Demo',
      email: 'manager@sawingir.com',
      username: 'manager',
      passwordHash: passwordHashes.manager,
      department: 'Manager',
      roleId: roles[1].id,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { username: 'frontoffice' },
    update: {
      fullName: 'Front Office Demo',
      email: 'frontoffice@sawingir.com',
      passwordHash: passwordHashes.frontoffice,
      department: 'FrontOffice',
      roleId: roles[2].id,
      status: 'active',
    },
    create: {
      fullName: 'Front Office Demo',
      email: 'frontoffice@sawingir.com',
      username: 'frontoffice',
      passwordHash: passwordHashes.frontoffice,
      department: 'FrontOffice',
      roleId: roles[2].id,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { username: 'restaurantstaff' },
    update: {
      fullName: 'Restaurant Staff Demo',
      email: 'restaurantstaff@sawingir.com',
      passwordHash: passwordHashes.restaurantstaff,
      department: 'RestaurantPOS',
      roleId: roles[4].id,
      status: 'active',
    },
    create: {
      fullName: 'Restaurant Staff Demo',
      email: 'restaurantstaff@sawingir.com',
      username: 'restaurantstaff',
      passwordHash: passwordHashes.restaurantstaff,
      department: 'RestaurantPOS',
      roleId: roles[4].id,
      status: 'active',
    },
  });
  console.log('  users: admin, dev, manager, frontoffice, restaurantstaff');

  const roomTypes = await Promise.all([
    prisma.roomType.upsert({
      where: { name: 'Single Room' },
      update: { description: 'Comfortable single room with mountain views', basePrice: 12000, maxOccupancy: 1, totalRooms: 3, isActive: true },
      create: { name: 'Single Room', description: 'Comfortable single room with mountain views', basePrice: 12000, maxOccupancy: 1, totalRooms: 3 },
    }),
    prisma.roomType.upsert({
      where: { name: 'Double Room' },
      update: { description: 'Standard double room with balcony', basePrice: 16000, maxOccupancy: 2, totalRooms: 3, isActive: true },
      create: { name: 'Double Room', description: 'Standard double room with balcony', basePrice: 16000, maxOccupancy: 2, totalRooms: 3 },
    }),
    prisma.roomType.upsert({
      where: { name: 'Triple Room' },
      update: { description: 'Spacious room for small groups', basePrice: 21000, maxOccupancy: 3, totalRooms: 1, isActive: true },
      create: { name: 'Triple Room', description: 'Spacious room for small groups', basePrice: 21000, maxOccupancy: 3, totalRooms: 1 },
    }),
    prisma.roomType.upsert({
      where: { name: 'Honeymoon Suite' },
      update: { description: 'Suite with full-board experience included', basePrice: 32000, maxOccupancy: 2, totalRooms: 2, isActive: true },
      create: { name: 'Honeymoon Suite', description: 'Suite with full-board experience included', basePrice: 32000, maxOccupancy: 2, totalRooms: 2 },
    }),
    prisma.roomType.upsert({
      where: { name: 'Family Room' },
      update: { description: 'Large room suitable for families', basePrice: 26000, maxOccupancy: 5, totalRooms: 1, isActive: true },
      create: { name: 'Family Room', description: 'Large room suitable for families', basePrice: 26000, maxOccupancy: 5, totalRooms: 1 },
    }),
  ]);
  console.log(`  room types: ${roomTypes.length}`);

  const roomSeed = [
    { roomNumber: '101', roomTypeId: roomTypes[0].id, floor: 1, status: 'available', features: ['WiFi', 'Mountain View', 'AC'] },
    { roomNumber: '102', roomTypeId: roomTypes[0].id, floor: 1, status: 'available', features: ['WiFi', 'AC'] },
    { roomNumber: '103', roomTypeId: roomTypes[0].id, floor: 1, status: 'dirty', features: ['WiFi', 'AC'] },
    { roomNumber: '201', roomTypeId: roomTypes[1].id, floor: 2, status: 'occupied', features: ['WiFi', 'Balcony', 'AC'] },
    { roomNumber: '202', roomTypeId: roomTypes[1].id, floor: 2, status: 'available', features: ['WiFi', 'Balcony', 'AC'] },
    { roomNumber: '203', roomTypeId: roomTypes[1].id, floor: 2, status: 'maintenance', features: ['WiFi', 'Balcony', 'AC'] },
    { roomNumber: '301', roomTypeId: roomTypes[3].id, floor: 3, status: 'available', features: ['WiFi', 'Jacuzzi', 'Balcony'] },
    { roomNumber: '302', roomTypeId: roomTypes[3].id, floor: 3, status: 'available', features: ['WiFi', 'Jacuzzi', 'Balcony'] },
    { roomNumber: '401', roomTypeId: roomTypes[4].id, floor: 4, status: 'available', features: ['WiFi', 'Kitchenette', 'Living Area'] },
    { roomNumber: '402', roomTypeId: roomTypes[2].id, floor: 4, status: 'available', features: ['WiFi', 'Balcony', 'Living Area'] },
  ];

  for (const room of roomSeed) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {
        roomTypeId: room.roomTypeId,
        floor: room.floor,
        status: room.status as any,
        features: room.features,
        isActive: true,
      },
      create: {
        roomNumber: room.roomNumber,
        roomTypeId: room.roomTypeId,
        floor: room.floor,
        status: room.status as any,
        features: room.features,
        isActive: true,
      },
    });
  }
  console.log(`  rooms: ${roomSeed.length}`);

  const mealPlans = await Promise.all([
    upsertMealPlan({
      name: 'English Breakfast',
      mealType: 'breakfast',
      price: 1900,
      description: 'Classic breakfast plate for room guests',
      menuItems: ['Eggs', 'Sausage', 'Toast', 'Tea or coffee'],
    }),
    upsertMealPlan({
      name: 'Sri Lankan Rice and Curry',
      mealType: 'lunch',
      price: 1800,
      description: 'Traditional lunch buffet',
      menuItems: ['Rice', 'Fish curry', 'Chicken curry', 'Vegetables'],
    }),
    upsertMealPlan({
      name: 'Flame and Feast Dinner',
      mealType: 'dinner',
      price: 2400,
      description: 'Grilled dinner buffet',
      menuItems: ['Soup', 'BBQ chicken', 'Seafood', 'Dessert'],
    }),
  ]);
  console.log(`  meal plans: ${mealPlans.length}`);

  const restaurantCategoryDefinitions = [
    { key: 'starters', name: 'Starters', description: 'Salads and appetizers', sortOrder: 1 },
    { key: 'soup', name: 'Soup', description: 'Hot soups and broths', sortOrder: 2 },
    { key: 'sandwiches', name: 'Sandwiches', description: 'Fresh sandwiches and clubs', sortOrder: 3 },
    { key: 'juices', name: 'Juices', description: 'Fresh juices and signature drinks', sortOrder: 4 },
    { key: 'western-foods', name: 'Western Foods', description: 'Western mains and grills', sortOrder: 5 },
    { key: 'rice', name: 'Rice', description: 'Rice-based main dishes', sortOrder: 6 },
    { key: 'noodles', name: 'Noodles', description: 'Noodles and mee goreng dishes', sortOrder: 7 },
    { key: 'pasta-spaghetti', name: 'Pasta & Spaghetti', description: 'Pasta favorites', sortOrder: 8 },
    { key: 'kottu', name: 'Kottu', description: 'Sri Lankan kottu options', sortOrder: 9 },
    { key: 'snacks', name: 'Snacks', description: 'Quick bites and short eats', sortOrder: 10 },
    { key: 'desserts', name: 'Desserts', description: 'Desserts and sweets', sortOrder: 11 },
    { key: 'omelette', name: 'Omelette', description: 'Egg and omelette dishes', sortOrder: 12 },
    { key: 'bites-one-portion', name: 'Bites - One Portion', description: 'Bites sold by portion', sortOrder: 13 },
    { key: 'bites-one-kilo', name: 'Bites - One Kilo', description: 'Bites sold by kilo', sortOrder: 14 },
    { key: 'beverages', name: 'Beverages', description: 'Soft drinks and bottled water', sortOrder: 15 },
  ] as const;

  const restaurantCategories: Record<string, Awaited<ReturnType<typeof upsertMenuCategory>>> = {};
  for (const category of restaurantCategoryDefinitions) {
    restaurantCategories[category.key] = await upsertMenuCategory({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
    });
  }

  const publicRestaurantImageLibrary = {
    salad: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Caesar_salad_%282%29.jpg/250px-Caesar_salad_%282%29.jpg',
    soup: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Asparagus_soup_%28spargelsuppe%29.jpg/250px-Asparagus_soup_%28spargelsuppe%29.jpg',
    sandwich: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Club_sandwich_at_Caf%C3%A9_Picnic.jpg/250px-Club_sandwich_at_Caf%C3%A9_Picnic.jpg',
    juice: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Orange_Juice_Pulp.jpg/250px-Orange_Juice_Pulp.jpg',
    western: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Fish_and_chips_blackpool.jpg/330px-Fish_and_chips_blackpool.jpg',
    rice: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg/250px-Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg',
    noodles: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Homemade_Chow_mein_with_shrimps_and_meat_with_a_choy_and_Choung.jpg/250px-Homemade_Chow_mein_with_shrimps_and_meat_with_a_choy_and_Choung.jpg',
    pasta: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Espaguetis_carbonara.jpg/250px-Espaguetis_carbonara.jpg',
    kottu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chicken_Kottu.jpg/250px-Chicken_Kottu.jpg',
    pizza: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Traditional_pizza_from_Napoli.jpg/250px-Traditional_pizza_from_Napoli.jpg',
    dessert: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Baked_cheesecake_with_raspberries_and_blueberries.jpg/250px-Baked_cheesecake_with_raspberries_and_blueberries.jpg',
    milkshake: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Strawberry_milk_shake_%28cropped%29.jpg/250px-Strawberry_milk_shake_%28cropped%29.jpg',
    omelette: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Gorgonzola_%2B_Bacon_Omelette_%40_Omelegg_%40_Amsterdam_%2816600947041%29.jpg/250px-Gorgonzola_%2B_Bacon_Omelette_%40_Omelegg_%40_Amsterdam_%2816600947041%29.jpg',
    bites: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/French_Fries.JPG/250px-French_Fries.JPG',
    hotButterCuttlefish: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Plate_of_Hot_Butter_Cuttlefish.jpg/250px-Plate_of_Hot_Butter_Cuttlefish.jpg',
    water: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Multi-use_water_bottle.JPG/250px-Multi-use_water_bottle.JPG',
  } as const;

  function getRestaurantPublicImageUrl(categoryKey: string, itemName: string) {
    const normalizedName = itemName.toLowerCase();

    if (normalizedName.includes('salad')) return publicRestaurantImageLibrary.salad;
    if (normalizedName.includes('soup') || normalizedName.includes('broth')) return publicRestaurantImageLibrary.soup;
    if (normalizedName.includes('sandwich')) return publicRestaurantImageLibrary.sandwich;
    if (normalizedName.includes('juice') || normalizedName.includes('tea') || normalizedName.includes('coffee') || normalizedName.includes('mojito') || normalizedName.includes('cordial')) {
      return publicRestaurantImageLibrary.juice;
    }
    if (normalizedName.includes('shake')) return publicRestaurantImageLibrary.milkshake;
    if (normalizedName.includes('pizza')) return publicRestaurantImageLibrary.pizza;
    if (normalizedName.includes('omelette') || normalizedName.includes('fried eggs')) return publicRestaurantImageLibrary.omelette;
    if (normalizedName.includes('cheesecake') || normalizedName.includes('ice cream') || normalizedName.includes('pudding') || normalizedName.includes('watalappan') || normalizedName.includes('dessert') || normalizedName.includes('fruit platter')) {
      return publicRestaurantImageLibrary.dessert;
    }
    if (normalizedName.includes('kottu')) return publicRestaurantImageLibrary.kottu;
    if (normalizedName.includes('cuttlefish')) return publicRestaurantImageLibrary.hotButterCuttlefish;
    if (normalizedName.includes('water') || normalizedName.includes('coca cola') || normalizedName.includes('sprite') || normalizedName.includes('soda')) {
      return publicRestaurantImageLibrary.water;
    }

    switch (categoryKey) {
      case 'western-foods':
        return publicRestaurantImageLibrary.western;
      case 'rice':
        return publicRestaurantImageLibrary.rice;
      case 'noodles':
        return publicRestaurantImageLibrary.noodles;
      case 'pasta-spaghetti':
        return publicRestaurantImageLibrary.pasta;
      case 'snacks':
        return publicRestaurantImageLibrary.pizza;
      case 'bites-one-portion':
      case 'bites-one-kilo':
        return publicRestaurantImageLibrary.bites;
      case 'juices':
        return publicRestaurantImageLibrary.juice;
      case 'desserts':
        return publicRestaurantImageLibrary.dessert;
      case 'beverages':
        return publicRestaurantImageLibrary.water;
      default:
        return undefined;
    }
  }

  const restaurantMenuDefinitions: Array<{ categoryKey: string; name: string; description: string; price: number; preparationTime: number; sortOrder: number; isVegetarian?: boolean; isSpicy?: boolean; }> = [
    { categoryKey: 'starters', name: 'Mix Green Salad', description: '', price: 650, preparationTime: 8, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'starters', name: 'Hawaii Chicken Salad', description: '', price: 750, preparationTime: 10, sortOrder: 2 },
    { categoryKey: 'starters', name: 'Watermelon & Feta Cheese Salad', description: '', price: 750, preparationTime: 8, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'starters', name: 'Noodles Salad with Lime Vinaigrette', description: '', price: 800, preparationTime: 9, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'starters', name: 'Caesar Salad', description: '', price: 900, preparationTime: 8, sortOrder: 5 },
    { categoryKey: 'starters', name: 'Grilled Vegetable Salad', description: '', price: 1100, preparationTime: 10, sortOrder: 6, isVegetarian: true },

    { categoryKey: 'soup', name: 'Soup of the Day', description: '', price: 800, preparationTime: 10, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'soup', name: 'Mix Vegetable Broth', description: '', price: 900, preparationTime: 10, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'soup', name: 'Cream of Vegetable Soup', description: '', price: 950, preparationTime: 10, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'soup', name: 'Egg Drop & Sweet Corn Soup', description: '', price: 950, preparationTime: 10, sortOrder: 4 },
    { categoryKey: 'soup', name: 'Cream of Chicken Soup', description: '', price: 1000, preparationTime: 10, sortOrder: 5 },
    { categoryKey: 'soup', name: 'Hot & Sour Seafood Soup', description: '', price: 1200, preparationTime: 12, sortOrder: 6, isSpicy: true },

    { categoryKey: 'sandwiches', name: 'Vegetable Sandwich', description: '', price: 950, preparationTime: 10, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'sandwiches', name: 'Cheese & Tomato Sandwich', description: '', price: 1000, preparationTime: 10, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'sandwiches', name: 'Ham & Cheese Sandwich', description: '', price: 1100, preparationTime: 10, sortOrder: 3 },
    { categoryKey: 'sandwiches', name: 'Tuna Sandwich', description: '', price: 1100, preparationTime: 10, sortOrder: 4 },
    { categoryKey: 'sandwiches', name: 'Chicken Sandwich', description: '', price: 1100, preparationTime: 10, sortOrder: 5 },
    { categoryKey: 'sandwiches', name: 'Crispy Chicken Sandwich', description: '', price: 1200, preparationTime: 12, sortOrder: 6 },
    { categoryKey: 'sandwiches', name: 'Cheese & Garlic Sandwich', description: '', price: 1200, preparationTime: 10, sortOrder: 7, isVegetarian: true },
    { categoryKey: 'sandwiches', name: 'Club Sandwich', description: '', price: 1400, preparationTime: 12, sortOrder: 8 },

    { categoryKey: 'juices', name: 'Lime Juice', description: '', price: 650, preparationTime: 4, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'juices', name: 'Watermelon Juice', description: '', price: 650, preparationTime: 4, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'juices', name: 'Papaya Juice', description: '', price: 650, preparationTime: 4, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'juices', name: 'Pineapple Juice', description: '', price: 800, preparationTime: 4, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'juices', name: 'Mango Juice', description: '', price: 900, preparationTime: 4, sortOrder: 5, isVegetarian: true },
    { categoryKey: 'juices', name: 'Orange Juice', description: '', price: 1000, preparationTime: 4, sortOrder: 6, isVegetarian: true },
    { categoryKey: 'juices', name: 'Sawingir Hills Mixed Fresh Juice', description: '', price: 750, preparationTime: 5, sortOrder: 7, isVegetarian: true },
    { categoryKey: 'juices', name: 'Sunquick Cordial', description: 'Orange 1L', price: 1300, preparationTime: 2, sortOrder: 8, isVegetarian: true },
    { categoryKey: 'juices', name: 'Mojito', description: 'Lime, passion, mango, or black currant', price: 850, preparationTime: 5, sortOrder: 9, isVegetarian: true },
    { categoryKey: 'juices', name: 'Milk Shake', description: 'Vanilla, chocolate, or strawberry', price: 950, preparationTime: 5, sortOrder: 10, isVegetarian: true },
    { categoryKey: 'juices', name: 'Banana & Date Shake', description: '', price: 1100, preparationTime: 5, sortOrder: 11, isVegetarian: true },
    { categoryKey: 'juices', name: 'Sawingir Hills Swiss Chocolate Shake', description: '', price: 1300, preparationTime: 5, sortOrder: 12, isVegetarian: true },
    { categoryKey: 'juices', name: 'Pot of Freshly Brewed Tea or Coffee', description: '', price: 700, preparationTime: 6, sortOrder: 13, isVegetarian: true },

    { categoryKey: 'western-foods', name: 'Seasonal Buttered Vegetables', description: 'Served with french fries', price: 1200, preparationTime: 12, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'western-foods', name: 'Fish & Chips with Tartar Sauce', description: 'Served with mixed vegetables and french fries', price: 2100, preparationTime: 18, sortOrder: 2 },
    { categoryKey: 'western-foods', name: 'Grilled Chicken Breast with BBQ Sauce', description: 'Served with plain rice, mixed vegetables and french fries', price: 2200, preparationTime: 20, sortOrder: 3 },
    { categoryKey: 'western-foods', name: 'Chicken Cordon Bleu with French Fries', description: '', price: 2900, preparationTime: 22, sortOrder: 4 },
    { categoryKey: 'western-foods', name: 'Grilled Seer Fish with Lemon Butter Sauce', description: 'Served with chilli garlic dip and french fries', price: 3000, preparationTime: 22, sortOrder: 5 },
    { categoryKey: 'western-foods', name: 'Sawingir Hills Special Mixed Grill', description: '', price: 4500, preparationTime: 28, sortOrder: 6 },

    { categoryKey: 'rice', name: 'Vegetable Fried Rice', description: '', price: 1000, preparationTime: 14, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'rice', name: 'Egg Fried Rice', description: '', price: 1100, preparationTime: 14, sortOrder: 2 },
    { categoryKey: 'rice', name: 'Chicken Fried Rice', description: '', price: 1300, preparationTime: 15, sortOrder: 3 },
    { categoryKey: 'rice', name: 'Seafood Fried Rice', description: '', price: 1400, preparationTime: 15, sortOrder: 4 },
    { categoryKey: 'rice', name: 'Mixed Fried Rice', description: '', price: 1500, preparationTime: 15, sortOrder: 5 },
    { categoryKey: 'rice', name: 'Nasi Goreng Chicken', description: '', price: 1500, preparationTime: 15, sortOrder: 6, isSpicy: true },
    { categoryKey: 'rice', name: 'Nasi Goreng Seafood', description: '', price: 1600, preparationTime: 15, sortOrder: 7, isSpicy: true },
    { categoryKey: 'rice', name: 'Nasi Goreng Mixed', description: '', price: 1700, preparationTime: 15, sortOrder: 8, isSpicy: true },
    { categoryKey: 'rice', name: 'Mongolian Rice', description: '', price: 1700, preparationTime: 16, sortOrder: 9 },
    { categoryKey: 'rice', name: 'Sawingir Hills Special Rice', description: '', price: 1750, preparationTime: 16, sortOrder: 10 },
    { categoryKey: 'rice', name: 'Vegetable Chopsuey Rice', description: '', price: 1250, preparationTime: 15, sortOrder: 11, isVegetarian: true },
    { categoryKey: 'rice', name: 'Chicken Chopsuey Rice', description: '', price: 1500, preparationTime: 15, sortOrder: 12 },
    { categoryKey: 'rice', name: 'Seafood Chopsuey Rice', description: '', price: 1700, preparationTime: 15, sortOrder: 13 },
    { categoryKey: 'rice', name: 'Mixed Chopsuey Rice', description: '', price: 1800, preparationTime: 16, sortOrder: 14 },
    { categoryKey: 'rice', name: 'Vegetable Biriyani', description: '', price: 1300, preparationTime: 18, sortOrder: 15, isVegetarian: true },
    { categoryKey: 'rice', name: 'Chicken Biriyani', description: '', price: 1750, preparationTime: 18, sortOrder: 16 },

    { categoryKey: 'noodles', name: 'Vegetable Noodles', description: '', price: 950, preparationTime: 14, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'noodles', name: 'Egg Fried Noodles', description: '', price: 1000, preparationTime: 14, sortOrder: 2 },
    { categoryKey: 'noodles', name: 'Chicken Fried Noodles', description: '', price: 1200, preparationTime: 15, sortOrder: 3 },
    { categoryKey: 'noodles', name: 'Seafood Fried Noodles', description: '', price: 1300, preparationTime: 15, sortOrder: 4 },
    { categoryKey: 'noodles', name: 'Mixed Fried Noodles', description: '', price: 1400, preparationTime: 15, sortOrder: 5 },
    { categoryKey: 'noodles', name: 'Chicken Meegoreng', description: '', price: 1500, preparationTime: 16, sortOrder: 6, isSpicy: true },
    { categoryKey: 'noodles', name: 'Seafood Meegoreng', description: '', price: 1600, preparationTime: 16, sortOrder: 7, isSpicy: true },
    { categoryKey: 'noodles', name: 'Mixed Meegoreng Noodles', description: '', price: 1700, preparationTime: 16, sortOrder: 8, isSpicy: true },
    { categoryKey: 'noodles', name: 'Sawingir Hills Special', description: '', price: 1750, preparationTime: 16, sortOrder: 9 },

    { categoryKey: 'pasta-spaghetti', name: 'Penne Napolitana', description: '', price: 1000, preparationTime: 14, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'pasta-spaghetti', name: 'Spaghetti Napolitana', description: '', price: 1100, preparationTime: 14, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'pasta-spaghetti', name: 'Creamy Chicken Pasta', description: '', price: 1450, preparationTime: 16, sortOrder: 3 },
    { categoryKey: 'pasta-spaghetti', name: 'Spaghetti Carbonara', description: '', price: 1450, preparationTime: 16, sortOrder: 4 },
    { categoryKey: 'pasta-spaghetti', name: 'Chicken Penne Alfredo', description: '', price: 1500, preparationTime: 16, sortOrder: 5 },
    { categoryKey: 'pasta-spaghetti', name: 'Creamy Seafood Pasta', description: '', price: 1550, preparationTime: 17, sortOrder: 6 },
    { categoryKey: 'pasta-spaghetti', name: 'Spaghetti Bolognese', description: '', price: 1600, preparationTime: 17, sortOrder: 7 },

    { categoryKey: 'kottu', name: 'Vegetable Kottu', description: '', price: 1000, preparationTime: 15, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'kottu', name: 'Egg Kottu', description: '', price: 1100, preparationTime: 15, sortOrder: 2 },
    { categoryKey: 'kottu', name: 'Fish Kottu', description: '', price: 1300, preparationTime: 16, sortOrder: 3 },
    { categoryKey: 'kottu', name: 'Chicken Kottu', description: '', price: 1200, preparationTime: 16, sortOrder: 4, isSpicy: true },
    { categoryKey: 'kottu', name: 'Seafood Kottu', description: 'Add cheese for Rs.350', price: 1400, preparationTime: 16, sortOrder: 5, isSpicy: true },

    { categoryKey: 'snacks', name: 'Chicken Mini Pizza', description: '', price: 350, preparationTime: 8, sortOrder: 1 },
    { categoryKey: 'snacks', name: 'Seafood Mini Pizza', description: '', price: 350, preparationTime: 8, sortOrder: 2 },
    { categoryKey: 'snacks', name: 'Magarita Mini Pizza', description: '', price: 300, preparationTime: 8, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'snacks', name: 'Fish Roll', description: '', price: 175, preparationTime: 5, sortOrder: 4 },
    { categoryKey: 'snacks', name: 'Chicken Sandwich', description: '', price: 250, preparationTime: 5, sortOrder: 5 },
    { categoryKey: 'snacks', name: 'Chocolate Eclair', description: '', price: 300, preparationTime: 3, sortOrder: 6, isVegetarian: true },
    { categoryKey: 'snacks', name: 'Vegetable Roll', description: '', price: 150, preparationTime: 5, sortOrder: 7, isVegetarian: true },
    { categoryKey: 'snacks', name: 'Mini Vade 3 Nos', description: '', price: 200, preparationTime: 5, sortOrder: 8, isVegetarian: true },
    { categoryKey: 'snacks', name: 'Baked Fish Pattie', description: '', price: 250, preparationTime: 5, sortOrder: 9 },

    { categoryKey: 'desserts', name: 'Dessert of the Day', description: '', price: 700, preparationTime: 4, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Cream Caramel Pudding', description: '', price: 500, preparationTime: 4, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Ice Cream', description: 'Vanilla, chocolate, or strawberry', price: 500, preparationTime: 3, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Curd & Treacle', description: '', price: 550, preparationTime: 3, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Fruit Salad with Ice Cream', description: '', price: 700, preparationTime: 4, sortOrder: 5, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Hot Chocolate Pudding or Lava Cake', description: '', price: 700, preparationTime: 8, sortOrder: 6, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Watalappan', description: '', price: 700, preparationTime: 4, sortOrder: 7, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Fresh Fruit Platter', description: '', price: 900, preparationTime: 4, sortOrder: 8, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Cheesecake', description: '', price: 900, preparationTime: 4, sortOrder: 9, isVegetarian: true },
    { categoryKey: 'desserts', name: 'Sawingir Hills Queen', description: '', price: 1800, preparationTime: 6, sortOrder: 10, isVegetarian: true },

    { categoryKey: 'omelette', name: 'Fried Eggs', description: '', price: 400, preparationTime: 5, sortOrder: 1 },
    { categoryKey: 'omelette', name: 'Sri Lankan Omelette', description: '', price: 1100, preparationTime: 10, sortOrder: 2, isSpicy: true },
    { categoryKey: 'omelette', name: 'Chicken Omelette', description: '', price: 1300, preparationTime: 10, sortOrder: 3 },
    { categoryKey: 'omelette', name: 'Ham & Cheese Omelette', description: '', price: 1400, preparationTime: 10, sortOrder: 4 },
    { categoryKey: 'omelette', name: 'Meat Mixed Omelette', description: '', price: 1550, preparationTime: 10, sortOrder: 5 },
    { categoryKey: 'omelette', name: 'Cheese & Chicken Omelette', description: '', price: 1450, preparationTime: 10, sortOrder: 6 },

    { categoryKey: 'bites-one-portion', name: 'Vegetable Chopsuey', description: '', price: 850, preparationTime: 12, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Fried Garlic', description: '', price: 1000, preparationTime: 10, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Boiled Potato', description: '', price: 1000, preparationTime: 10, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Boiled Vegetables', description: '', price: 1200, preparationTime: 10, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'French Fries', description: '', price: 1200, preparationTime: 8, sortOrder: 5, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Hot Butter Mushroom', description: '', price: 1200, preparationTime: 12, sortOrder: 6, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Devilled Mushroom', description: '', price: 1200, preparationTime: 12, sortOrder: 7, isVegetarian: true, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Devilled Sausages', description: '', price: 1250, preparationTime: 12, sortOrder: 8 },
    { categoryKey: 'bites-one-portion', name: 'Batter Fried Onion Rings', description: '', price: 1250, preparationTime: 10, sortOrder: 9, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Fried Chicken', description: '', price: 1200, preparationTime: 12, sortOrder: 10 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Chicken', description: '', price: 1300, preparationTime: 12, sortOrder: 11, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Chilli Chicken', description: '', price: 1300, preparationTime: 12, sortOrder: 12, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Chicken Pepper Stew', description: '', price: 1300, preparationTime: 14, sortOrder: 13, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Fried Fish', description: '', price: 1100, preparationTime: 12, sortOrder: 14 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Fish', description: '', price: 1200, preparationTime: 12, sortOrder: 15, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Chilli Fish', description: '', price: 1250, preparationTime: 12, sortOrder: 16, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Fish Pepper Stew', description: '', price: 1300, preparationTime: 14, sortOrder: 17, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Fried Pork', description: '', price: 2450, preparationTime: 14, sortOrder: 18 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Pork', description: '', price: 2500, preparationTime: 14, sortOrder: 19, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Pork Pepper Stew', description: '', price: 2550, preparationTime: 14, sortOrder: 20, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Pork Black Curry', description: '', price: 2550, preparationTime: 14, sortOrder: 21, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Batter Fried Cuttlefish', description: '', price: 2000, preparationTime: 14, sortOrder: 22 },
    { categoryKey: 'bites-one-portion', name: 'Black Cuttlefish Curry', description: '', price: 2000, preparationTime: 14, sortOrder: 23, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Hot Butter Cuttlefish', description: '', price: 2250, preparationTime: 14, sortOrder: 24 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Cuttlefish', description: '', price: 2250, preparationTime: 14, sortOrder: 25, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Batter Fried Prawns', description: '', price: 2300, preparationTime: 14, sortOrder: 26 },
    { categoryKey: 'bites-one-portion', name: 'Hot Butter Prawns', description: '', price: 2300, preparationTime: 14, sortOrder: 27 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Prawns', description: '', price: 2500, preparationTime: 14, sortOrder: 28, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Cashew Nuts', description: '', price: 2600, preparationTime: 6, sortOrder: 29, isVegetarian: true },
    { categoryKey: 'bites-one-portion', name: 'Fried Beef', description: '', price: 2550, preparationTime: 14, sortOrder: 30 },
    { categoryKey: 'bites-one-portion', name: 'Devilled Beef', description: '', price: 2600, preparationTime: 14, sortOrder: 31, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Pepper Beef Stew', description: '', price: 2650, preparationTime: 14, sortOrder: 32, isSpicy: true },
    { categoryKey: 'bites-one-portion', name: 'Beef Black Curry', description: '', price: 2650, preparationTime: 14, sortOrder: 33, isSpicy: true },

    { categoryKey: 'bites-one-kilo', name: 'Hot Butter Mushroom', description: '', price: 2600, preparationTime: 18, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Mushroom', description: '', price: 2600, preparationTime: 18, sortOrder: 2, isVegetarian: true, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Boiled Vegetables', description: '', price: 3500, preparationTime: 18, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'bites-one-kilo', name: 'French Fries', description: '', price: 4300, preparationTime: 15, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Sausages', description: '', price: 3800, preparationTime: 18, sortOrder: 5 },
    { categoryKey: 'bites-one-kilo', name: 'Fried Chicken', description: '', price: 4000, preparationTime: 18, sortOrder: 6 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Chicken', description: '', price: 4000, preparationTime: 18, sortOrder: 7, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Chicken Pepper Stew', description: '', price: 4100, preparationTime: 20, sortOrder: 8, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Fried Fish', description: '', price: 4600, preparationTime: 18, sortOrder: 9 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Fish', description: '', price: 4650, preparationTime: 18, sortOrder: 10, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Fish Pepper Stew', description: '', price: 4700, preparationTime: 20, sortOrder: 11, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Fried Pork', description: '', price: 6500, preparationTime: 20, sortOrder: 12 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Pork', description: '', price: 6550, preparationTime: 20, sortOrder: 13, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Pork Pepper Stew', description: '', price: 6600, preparationTime: 20, sortOrder: 14, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Pork Black Curry', description: '', price: 6600, preparationTime: 20, sortOrder: 15, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Batter Fried Cuttlefish', description: '', price: 4750, preparationTime: 20, sortOrder: 16 },
    { categoryKey: 'bites-one-kilo', name: 'Hot Butter Cuttlefish', description: '', price: 4750, preparationTime: 20, sortOrder: 17 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Cuttlefish', description: '', price: 4800, preparationTime: 20, sortOrder: 18, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Batter Fried Prawns', description: '', price: 5100, preparationTime: 20, sortOrder: 19 },
    { categoryKey: 'bites-one-kilo', name: 'Hot Butter Prawns', description: '', price: 5150, preparationTime: 20, sortOrder: 20 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Prawns', description: '', price: 5200, preparationTime: 20, sortOrder: 21, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Fried Beef', description: '', price: 6600, preparationTime: 20, sortOrder: 22 },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Beef', description: '', price: 6650, preparationTime: 20, sortOrder: 23, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Beef Pepper Stew', description: '', price: 6700, preparationTime: 20, sortOrder: 24, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Beef Black Curry', description: '', price: 6700, preparationTime: 20, sortOrder: 25, isSpicy: true },
    { categoryKey: 'bites-one-kilo', name: 'Devilled Gram', description: '', price: 2250, preparationTime: 12, sortOrder: 26, isVegetarian: true, isSpicy: true },

    { categoryKey: 'beverages', name: 'Soda/Sprite/Coca Cola 400ML', description: '', price: 250, preparationTime: 2, sortOrder: 1, isVegetarian: true },
    { categoryKey: 'beverages', name: 'Soda/Sprite/Coca Cola 1.5L', description: '', price: 600, preparationTime: 2, sortOrder: 2, isVegetarian: true },
    { categoryKey: 'beverages', name: 'Water 500ML', description: '', price: 120, preparationTime: 1, sortOrder: 3, isVegetarian: true },
    { categoryKey: 'beverages', name: 'Water 1L', description: '', price: 200, preparationTime: 1, sortOrder: 4, isVegetarian: true },
    { categoryKey: 'beverages', name: 'Water 1.5L', description: '', price: 250, preparationTime: 1, sortOrder: 5, isVegetarian: true },
  ] as const;

  const restaurantMenuItems = new Map<string, Awaited<ReturnType<typeof upsertMenuItem>>>();
  for (const item of restaurantMenuDefinitions) {
    const seededItem = await upsertMenuItem({
      name: item.name,
      categoryId: restaurantCategories[item.categoryKey].id,
      description: item.description,
      price: item.price,
      preparationTime: item.preparationTime,
      sortOrder: item.sortOrder,
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy,
      imageUrl: getRestaurantPublicImageUrl(item.categoryKey, item.name),
    });
    restaurantMenuItems.set(`${item.categoryKey}:${item.name}`, seededItem);
  }

  const soupOfDay = restaurantMenuItems.get('soup:Soup of the Day')!;
  const chickenKottu = restaurantMenuItems.get('kottu:Chicken Kottu')!;
  const clubSandwich = restaurantMenuItems.get('sandwiches:Club Sandwich')!;
  const limeJuice = restaurantMenuItems.get('juices:Lime Juice')!;
  console.log(`  restaurant menu: seeded ${restaurantCategoryDefinitions.length} categories and ${restaurantMenuDefinitions.length} items`);
  const arrivalGuest = await upsertGuest({
    firstName: 'Amaya',
    lastName: 'Perera',
    email: 'amaya.perera@example.com',
    phone: '+94771234567',
    nationality: 'LK',
    idNumber: '199012345678',
  });
  const stayingGuest = await upsertGuest({
    firstName: 'Daniel',
    lastName: 'Silva',
    email: 'daniel.silva@example.com',
    phone: '+94772345678',
    nationality: 'LK',
    idNumber: '198812345678',
    totalStays: 2,
    totalSpent: 54000,
  });
  const pastGuest = await upsertGuest({
    firstName: 'Nadia',
    lastName: 'Fernando',
    email: 'nadia.fernando@example.com',
    phone: '+94773456789',
    nationality: 'LK',
    idNumber: '198512345678',
    totalStays: 4,
    totalSpent: 148000,
  });

  const room101 = await prisma.room.findUniqueOrThrow({ where: { roomNumber: '101' } });
  const room201 = await prisma.room.findUniqueOrThrow({ where: { roomNumber: '201' } });
  const room202 = await prisma.room.findUniqueOrThrow({ where: { roomNumber: '202' } });
  const frontOfficeUser = await prisma.user.findUniqueOrThrow({ where: { username: 'frontoffice' } });
  const restaurantStaffUser = await prisma.user.findUniqueOrThrow({ where: { username: 'restaurantstaff' } });

  const today = startOfDay();
  const todayPlus2 = addDays(today, 2);
  const twoDaysAgo = addDays(today, -2);
  const fiveDaysAgo = addDays(today, -5);
  const threeDaysAgo = addDays(today, -3);

  const arrivalPricing = calculateBookingPricing({
    roomTypeName: roomTypes[0].name,
    maxOccupancy: roomTypes[0].maxOccupancy,
    basePrice: Number(roomTypes[0].basePrice),
    mealPlan: 'bnb',
    nights: 2,
    additionalMealsTotal: 0,
  });

  const stayPricing = calculateBookingPricing({
    roomTypeName: roomTypes[1].name,
    maxOccupancy: roomTypes[1].maxOccupancy,
    basePrice: Number(roomTypes[1].basePrice),
    mealPlan: 'half_board',
    nights: 2,
    additionalMealsTotal: 0,
  });

  const pastPricing = calculateBookingPricing({
    roomTypeName: roomTypes[1].name,
    maxOccupancy: roomTypes[1].maxOccupancy,
    basePrice: Number(roomTypes[1].basePrice),
    mealPlan: 'room_only',
    nights: 2,
    additionalMealsTotal: 0,
  });

  const arrivalBooking = await prisma.booking.upsert({
    where: { bookingRef: 'BK-DEMO-ARRIVE' },
    update: {
      guestId: arrivalGuest.id,
      roomId: room101.id,
      roomTypeId: roomTypes[0].id,
      checkIn: today,
      checkOut: todayPlus2,
      nights: 2,
      adults: 1,
      children: 0,
      mealPlan: 'bnb',
      roomRate: arrivalPricing.roomRate,
      mealSurcharge: arrivalPricing.mealSurcharge,
      subtotal: arrivalPricing.subtotal,
      taxAmount: arrivalPricing.taxAmount,
      serviceCharge: arrivalPricing.serviceCharge,
      totalAmount: arrivalPricing.totalAmount,
      advancePaid: 0,
      balanceDue: arrivalPricing.totalAmount,
      status: 'confirmed',
      source: 'website',
      specialRequests: 'Mountain-facing room if available',
      createdBy: frontOfficeUser.id,
    },
    create: {
      bookingRef: 'BK-DEMO-ARRIVE',
      guestId: arrivalGuest.id,
      roomId: room101.id,
      roomTypeId: roomTypes[0].id,
      checkIn: today,
      checkOut: todayPlus2,
      nights: 2,
      adults: 1,
      children: 0,
      mealPlan: 'bnb',
      roomRate: arrivalPricing.roomRate,
      mealSurcharge: arrivalPricing.mealSurcharge,
      subtotal: arrivalPricing.subtotal,
      taxAmount: arrivalPricing.taxAmount,
      serviceCharge: arrivalPricing.serviceCharge,
      totalAmount: arrivalPricing.totalAmount,
      advancePaid: 0,
      balanceDue: arrivalPricing.totalAmount,
      status: 'confirmed',
      source: 'website',
      specialRequests: 'Mountain-facing room if available',
      createdBy: frontOfficeUser.id,
    },
  });

  const stayingBooking = await prisma.booking.upsert({
    where: { bookingRef: 'BK-DEMO-STAY' },
    update: {
      guestId: stayingGuest.id,
      roomId: room201.id,
      roomTypeId: roomTypes[1].id,
      checkIn: twoDaysAgo,
      checkOut: today,
      nights: 2,
      adults: 2,
      children: 0,
      mealPlan: 'half_board',
      roomRate: stayPricing.roomRate,
      mealSurcharge: stayPricing.mealSurcharge,
      subtotal: stayPricing.subtotal,
      taxAmount: stayPricing.taxAmount,
      serviceCharge: stayPricing.serviceCharge,
      totalAmount: stayPricing.totalAmount,
      advancePaid: 12000,
      balanceDue: Math.max(stayPricing.totalAmount - 12000, 0),
      status: 'checked_in',
      source: 'direct',
      specialRequests: 'Late checkout requested',
      createdBy: frontOfficeUser.id,
    },
    create: {
      bookingRef: 'BK-DEMO-STAY',
      guestId: stayingGuest.id,
      roomId: room201.id,
      roomTypeId: roomTypes[1].id,
      checkIn: twoDaysAgo,
      checkOut: today,
      nights: 2,
      adults: 2,
      children: 0,
      mealPlan: 'half_board',
      roomRate: stayPricing.roomRate,
      mealSurcharge: stayPricing.mealSurcharge,
      subtotal: stayPricing.subtotal,
      taxAmount: stayPricing.taxAmount,
      serviceCharge: stayPricing.serviceCharge,
      totalAmount: stayPricing.totalAmount,
      advancePaid: 12000,
      balanceDue: Math.max(stayPricing.totalAmount - 12000, 0),
      status: 'checked_in',
      source: 'direct',
      specialRequests: 'Late checkout requested',
      createdBy: frontOfficeUser.id,
    },
  });

  const pastBooking = await prisma.booking.upsert({
    where: { bookingRef: 'BK-DEMO-PAST' },
    update: {
      guestId: pastGuest.id,
      roomId: room202.id,
      roomTypeId: roomTypes[1].id,
      checkIn: fiveDaysAgo,
      checkOut: threeDaysAgo,
      nights: 2,
      adults: 2,
      children: 1,
      mealPlan: 'room_only',
      roomRate: pastPricing.roomRate,
      mealSurcharge: pastPricing.mealSurcharge,
      subtotal: pastPricing.subtotal,
      taxAmount: pastPricing.taxAmount,
      serviceCharge: pastPricing.serviceCharge,
      totalAmount: pastPricing.totalAmount,
      advancePaid: pastPricing.totalAmount,
      balanceDue: 0,
      status: 'checked_out',
      source: 'ota',
      specialRequests: null,
      createdBy: frontOfficeUser.id,
    },
    create: {
      bookingRef: 'BK-DEMO-PAST',
      guestId: pastGuest.id,
      roomId: room202.id,
      roomTypeId: roomTypes[1].id,
      checkIn: fiveDaysAgo,
      checkOut: threeDaysAgo,
      nights: 2,
      adults: 2,
      children: 1,
      mealPlan: 'room_only',
      roomRate: pastPricing.roomRate,
      mealSurcharge: pastPricing.mealSurcharge,
      subtotal: pastPricing.subtotal,
      taxAmount: pastPricing.taxAmount,
      serviceCharge: pastPricing.serviceCharge,
      totalAmount: pastPricing.totalAmount,
      advancePaid: pastPricing.totalAmount,
      balanceDue: 0,
      status: 'checked_out',
      source: 'ota',
      createdBy: frontOfficeUser.id,
    },
  });
  console.log('  bookings: arrival today, in-house checkout today, completed stay');

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-DEMO-STAY' },
    update: {
      bookingId: stayingBooking.id,
      guestId: stayingGuest.id,
      subtotal: stayPricing.subtotal,
      taxAmount: stayPricing.taxAmount,
      serviceCharge: stayPricing.serviceCharge,
      totalAmount: stayPricing.totalAmount,
      paidAmount: 10000,
      balanceDue: Math.max(stayPricing.totalAmount - 10000, 0),
      status: 'partial',
      createdBy: frontOfficeUser.id,
    },
    create: {
      invoiceNumber: 'INV-DEMO-STAY',
      bookingId: stayingBooking.id,
      guestId: stayingGuest.id,
      subtotal: stayPricing.subtotal,
      taxAmount: stayPricing.taxAmount,
      serviceCharge: stayPricing.serviceCharge,
      totalAmount: stayPricing.totalAmount,
      paidAmount: 10000,
      balanceDue: Math.max(stayPricing.totalAmount - 10000, 0),
      status: 'partial',
      createdBy: frontOfficeUser.id,
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-DEMO-PAST' },
    update: {
      bookingId: pastBooking.id,
      guestId: pastGuest.id,
      subtotal: pastPricing.subtotal,
      taxAmount: pastPricing.taxAmount,
      serviceCharge: pastPricing.serviceCharge,
      totalAmount: pastPricing.totalAmount,
      paidAmount: pastPricing.totalAmount,
      balanceDue: 0,
      status: 'paid',
      createdBy: frontOfficeUser.id,
    },
    create: {
      invoiceNumber: 'INV-DEMO-PAST',
      bookingId: pastBooking.id,
      guestId: pastGuest.id,
      subtotal: pastPricing.subtotal,
      taxAmount: pastPricing.taxAmount,
      serviceCharge: pastPricing.serviceCharge,
      totalAmount: pastPricing.totalAmount,
      paidAmount: pastPricing.totalAmount,
      balanceDue: 0,
      status: 'paid',
      createdBy: frontOfficeUser.id,
    },
  });

  const stayInvoice = await prisma.invoice.findUniqueOrThrow({ where: { invoiceNumber: 'INV-DEMO-STAY' } });
  const pastInvoice = await prisma.invoice.findUniqueOrThrow({ where: { invoiceNumber: 'INV-DEMO-PAST' } });

  await prisma.payment.deleteMany({
    where: {
      referenceNo: { in: ['DEMO-PAY-TODAY', 'DEMO-PAY-PAST'] },
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        invoiceId: stayInvoice.id,
        amount: 10000,
        paymentMethod: 'cash',
        referenceNo: 'DEMO-PAY-TODAY',
        notes: 'Demo payment received today',
        paymentDate: addDays(today, 0),
        receivedBy: frontOfficeUser.id,
      },
      {
        invoiceId: pastInvoice.id,
        amount: pastPricing.totalAmount,
        paymentMethod: 'card',
        referenceNo: 'DEMO-PAY-PAST',
        notes: 'Completed past stay payment',
        paymentDate: addDays(today, -4),
        receivedBy: frontOfficeUser.id,
      },
    ],
  });
  console.log('  invoices and payments: ready for dashboard metrics');

  await upsertRestaurantOrder({
    orderNumber: 'ORD-DEMO-TABLE',
    orderType: 'dine_in',
    tableNumber: 'T4',
    status: 'pending',
    notes: 'Lecturer demo order for the kitchen screen',
    createdBy: restaurantStaffUser.id,
    items: [
      {
        menuItemId: soupOfDay.id,
        quantity: 1,
        unitPrice: Number(soupOfDay.price),
        status: 'pending',
      },
      {
        menuItemId: chickenKottu.id,
        quantity: 2,
        unitPrice: Number(chickenKottu.price),
        status: 'pending',
        specialInstructions: 'One less spicy',
      },
    ],
  });

  await upsertRestaurantOrder({
    orderNumber: 'ORD-DEMO-ROOM',
    orderType: 'room_service',
    roomId: room201.id,
    guestId: stayingGuest.id,
    bookingId: stayingBooking.id,
    status: 'preparing',
    notes: 'Deliver to balcony if guest answers call',
    createdBy: restaurantStaffUser.id,
    items: [
      {
        menuItemId: clubSandwich.id,
        quantity: 1,
        unitPrice: Number(clubSandwich.price),
        status: 'preparing',
      },
      {
        menuItemId: limeJuice.id,
        quantity: 2,
        unitPrice: Number(limeJuice.price),
        status: 'pending',
      },
    ],
  });
  console.log('  restaurant orders: seeded pending and preparing demo tickets');

  console.log('\nDemo accounts');
  console.log('  admin / Admin@123');
  console.log('  dev / Dev@123');
  console.log('  manager / Manager@123');
  console.log('  frontoffice / FrontOffice@123');
  console.log('  restaurantstaff / Restaurant@123');
  console.log('\nSeeding complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

