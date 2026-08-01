import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
);

const restaurantOrderStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'] as const;
const restaurantOrderItemStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'] as const;
const directRestaurantPaymentMethods = ['cash', 'card', 'bank_transfer', 'online', 'room_charge'] as const;
const splitRestaurantPaymentMethods = ['cash', 'card', 'bank_transfer', 'online'] as const;

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(200),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  department: z.enum(['Front Office', 'Restaurant POS', 'Housekeeping', 'Back Office', 'Manager', 'Admin']).optional(),
});

export const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be positive'),
  maxOccupancy: z.number().int().min(1).max(20),
  totalRooms: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  roomTypeId: z.number().int().positive(),
  floor: z.number().int().min(0).max(50),
  features: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'dirty', 'maintenance', 'out_of_order']),
});

export const guestSchema = z.object({
  id: z.number().int().positive().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  nationality: z.string().max(5).optional(),
  idNumber: z.string().max(50).optional(),
});

const bookingAdditionalMealSchema = z.object({
  mealPlanId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive().optional(),
});

const bookingRoomSelectionSchema = z.object({
  bookingId: z.number().int().positive().optional(),
  roomTypeId: z.number().int().positive(),
  roomId: z.number().int().positive().optional(),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10).default(0),
  mealPlan: z.enum(['room-only', 'bnb', 'half-board', 'full-board']).default('room-only'),
  additionalMeals: z.array(bookingAdditionalMealSchema).optional(),
});

export const createBookingSchema = z.object({
  guest: guestSchema,
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  nights: z.number().int().min(1).optional(),
  source: z.enum(['direct', 'ota', 'walk_in', 'corporate', 'phone', 'website']).default('direct'),
  specialRequests: z.string().optional(),
  roomTypeId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  adults: z.number().int().min(1).max(10).optional(),
  children: z.number().int().min(0).max(10).default(0),
  mealPlan: z.enum(['room-only', 'bnb', 'half-board', 'full-board']).default('room-only'),
  additionalMeals: z.array(bookingAdditionalMealSchema).optional(),
  rooms: z.array(bookingRoomSelectionSchema).min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.rooms?.length) {
    return;
  }

  if (!value.roomTypeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['roomTypeId'], message: 'Room type is required' });
  }
  if (!value.adults) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adults'], message: 'Adults are required' });
  }
});

export const updateBookingSchema = z.object({
  guest: guestSchema,
  roomTypeId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  nights: z.number().int().min(1),
  adults: z.number().int().min(1).max(10).optional(),
  children: z.number().int().min(0).max(10).default(0),
  mealPlan: z.enum(['room-only', 'bnb', 'half-board', 'full-board']).default('room-only'),
  source: z.enum(['direct', 'ota', 'walk_in', 'corporate', 'phone', 'website']).default('direct'),
  specialRequests: z.string().optional(),
  additionalMeals: z.array(bookingAdditionalMealSchema).optional(),
  rooms: z.array(bookingRoomSelectionSchema).min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.rooms?.length) {
    return;
  }

  if (!value.roomTypeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['roomTypeId'], message: 'Room type is required' });
  }
  if (!value.adults) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adults'], message: 'Adults are required' });
  }
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
  roomId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const recordBookingPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'online']),
  referenceNo: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const createRestaurantCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateRestaurantCategorySchema = createRestaurantCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one category field is required',
);

export const createMenuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  preparationTime: z.number().int().min(1).default(15),
  isVegetarian: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  imageUrl: optionalUrl,
});

export const createRestaurantTableSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  area: z.string().max(100).optional(),
  capacity: z.number().int().min(1).max(20).default(2),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateRestaurantTableSchema = createRestaurantTableSchema.partial().extend({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  'At least one table field is required',
);

export const updateRestaurantSettingsSchema = z.object({
  taxRate: z.number().min(0).max(1).optional(),
  serviceChargeRate: z.number().min(0).max(1).optional(),
  supportedPaymentMethods: z.array(z.enum(directRestaurantPaymentMethods)).min(1).optional(),
  supportedLabels: z.array(z.string().min(1).max(50)).max(12).optional(),
  qrAssetMode: z.string().min(1).max(50).optional(),
  specialInstructionsEnabled: z.boolean().optional(),
  roomChargePolicy: z.string().min(5).max(500).optional(),
  modifierPresets: z.array(z.string().min(1).max(80)).max(24).optional(),
  publicMenuPath: z.string().min(1).max(200).optional(),
  publicMenuTitle: z.string().min(1).max(120).optional(),
  publicMenuDescription: z.string().min(1).max(240).optional(),
  assetCollectionNotes: z.string().min(1).max(240).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  'At least one settings field is required',
);

const restaurantOrderItemInputSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  price: z.number().positive().optional(),
  specialInstructions: z.string().optional(),
});

export const createOrderSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway', 'room_service']).default('dine_in'),
  tableId: z.number().int().positive().optional(),
  tableNumber: z.string().max(10).optional(),
  roomId: z.number().int().positive().optional(),
  guestId: z.number().int().positive().optional(),
  bookingId: z.number().int().positive().optional(),
  notes: z.string().optional(),
  submitToKitchen: z.boolean().default(true),
  items: z.array(restaurantOrderItemInputSchema).min(1, 'Order must have at least one item'),
});

export const appendRestaurantOrderItemsSchema = z.object({
  notes: z.string().optional(),
  submitToKitchen: z.boolean().default(true),
  items: z.array(restaurantOrderItemInputSchema).min(1, 'Order must have at least one item'),
});

export const updateRestaurantOrderStatusSchema = z.object({
  status: z.enum(restaurantOrderStatuses),
});

export const updateRestaurantOrderItemStatusSchema = z.object({
  status: z.enum(restaurantOrderItemStatuses),
});

export const updateRestaurantPaymentSchema = z.object({
  paymentMethod: z.enum(directRestaurantPaymentMethods).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  discount: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  payments: z.array(z.object({
    paymentMethod: z.enum(splitRestaurantPaymentMethods),
    amount: z.number().positive(),
    referenceNo: z.string().max(100).optional(),
    notes: z.string().optional(),
  })).min(1).optional(),
  notes: z.string().optional(),
});

export const requestRestaurantVoidSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const createRestaurantRefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(3).max(500),
});

export const createMealPlanSchema = z.object({
  name: z.string().min(1).max(200),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'event-package']),
  price: z.number().positive(),
  description: z.string().optional(),
  menuItems: z.array(z.string()).optional(),
});

export const createEventReservationSchema = z.object({
  eventType: z.enum(['wedding', 'corporate', 'birthday', 'conference', 'daytrip', 'custom']),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().max(30).optional(),
  venueId: z.number().int().positive().optional(),
  packageId: z.number().int().positive().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.number().int().min(1),
  setupStyle: z.string().max(100).optional(),
  foodOptions: z.any().optional(),
  decorationNotes: z.string().optional(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export const createEventPackageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['wedding', 'corporate', 'birthday', 'conference', 'daytrip', 'custom']),
  pricePerPerson: z.number().positive(),
  minGuests: z.number().int().min(1),
  maxGuests: z.number().int().min(1),
  features: z.array(z.string()).optional(),
  foodOptions: z.any().optional(),
});

export const createHousekeepingTaskSchema = z.object({
  roomId: z.number().int().positive(),
  taskType: z.enum(['cleaning', 'deep_clean', 'turndown', 'inspection', 'maintenance', 'laundry']).default('cleaning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.number().int().positive().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']),
  roleId: z.number().int().positive().optional(),
});

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  username: z.string().min(3).max(100)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8).max(128),
  department: z.enum(['Front Office', 'Restaurant POS', 'Housekeeping', 'Back Office', 'Manager', 'Admin']),
  roleId: z.number().int().positive(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  department: z.enum(['Front Office', 'Restaurant POS', 'Housekeeping', 'Back Office', 'Manager', 'Admin']),
  roleId: z.number().int().positive(),
  password: z.string().min(8).max(128).optional().or(z.literal('')),
});

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.record(z.any()).optional(),
});


