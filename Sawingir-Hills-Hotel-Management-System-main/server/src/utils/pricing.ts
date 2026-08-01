interface RoomPricingInput {
  roomTypeName: string;
  maxOccupancy: number;
  basePrice: number;
  mealPlan: 'room_only' | 'bnb' | 'half_board' | 'full_board';
  nights: number;
  additionalMealsTotal: number;
}

export interface BookingPricingBreakdown {
  roomRate: number;
  mealSurcharge: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  balanceDue: number;
}

function normalizeRoomTypeName(name: string): string {
  return name.trim().toLowerCase();
}

function getOccupancyTier(roomTypeName: string, maxOccupancy: number): number {
  const normalizedName = normalizeRoomTypeName(roomTypeName);

  if (normalizedName.includes('single')) return 1;
  if (normalizedName.includes('double')) return 2;
  if (normalizedName.includes('triple')) return 3;

  return Math.min(Math.max(maxOccupancy, 1), 3);
}

export function getMealPlanSurcharge(
  roomTypeName: string,
  maxOccupancy: number,
  mealPlan: RoomPricingInput['mealPlan'],
): number {
  const normalizedName = normalizeRoomTypeName(roomTypeName);

  if (normalizedName.includes('honeymoon')) {
    if (mealPlan !== 'full_board') {
      throw new Error('Honeymoon Suite bookings must use Full Board');
    }
    return 0;
  }

  if (normalizedName.includes('family')) {
    if (mealPlan !== 'room_only') {
      throw new Error('Family Room bookings must use Room Only');
    }
    return 0;
  }

  const tier = getOccupancyTier(roomTypeName, maxOccupancy);
  const surchargeMap: Record<RoomPricingInput['mealPlan'], number> = {
    room_only: 0,
    bnb: 2000 * tier,
    half_board: 4000 * tier,
    full_board: 6000 * tier,
  };

  return surchargeMap[mealPlan];
}

export function calculateBookingPricing(input: RoomPricingInput): BookingPricingBreakdown {
  const mealSurcharge = getMealPlanSurcharge(input.roomTypeName, input.maxOccupancy, input.mealPlan);
  const roomRate = input.basePrice + mealSurcharge;
  const roomSubtotal = roomRate * input.nights;
  const subtotal = roomSubtotal + input.additionalMealsTotal;
  const taxAmount = subtotal * 0.12;
  const serviceCharge = subtotal * 0.1;
  const totalAmount = subtotal + taxAmount + serviceCharge;

  return {
    roomRate,
    mealSurcharge,
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount,
    balanceDue: totalAmount,
  };
}
