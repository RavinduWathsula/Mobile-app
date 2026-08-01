import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Minus, Plus, Loader2, CreditCard, Ban, UserX, Pencil, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface RoomTypeRecord {
  id: number;
  name: string;
  basePrice: number;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms: number;
}

interface MealPlanRecord {
  id: number;
  name: string;
  mealType: string;
  price: number;
}

interface SelectedMeal {
  mealPlanId: number;
  name: string;
  mealType: string;
  price: number;
  quantity: number;
}

interface LinkedRoomDraft {
  localId: string;
  roomTypeId: string;
  adults: string;
  children: string;
  mealPlan: string;
  selectedMeals: SelectedMeal[];
}

function formatCurrency(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function getMealPlanSurcharge(roomType: RoomTypeRecord | undefined, mealPlan: string) {
  if (!roomType) return 0;

  const normalizedName = roomType.name.toLowerCase();
  if (normalizedName.includes('honeymoon') || normalizedName.includes('family')) return 0;

  const tier = normalizedName.includes('single') ? 1 : normalizedName.includes('double') ? 2 : 3;
  const surchargeMap: Record<string, number> = {
    'room-only': 0,
    bnb: 2000 * tier,
    'half-board': 4000 * tier,
    'full-board': 6000 * tier,
  };

  return surchargeMap[mealPlan] || 0;
}

function createLinkedRoomDraft(): LinkedRoomDraft {
  return {
    localId: 'linked-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    roomTypeId: '',
    adults: '2',
    children: '0',
    mealPlan: 'room-only',
    selectedMeals: [],
  };
}

export function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('id');
  const mode = searchParams.get('mode') || (bookingId ? 'view' : 'create');
  const bookingIdNumber = bookingId ? Number(bookingId) : null;
  const isCreateMode = !bookingIdNumber || mode === 'create';
  const isEditMode = Boolean(bookingIdNumber) && mode === 'edit';
  const isViewMode = Boolean(bookingIdNumber) && mode === 'view';
  const isEditable = isCreateMode || isEditMode;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeRecord[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [bookingData, setBookingData] = useState<any>(null);
  const [linkedRooms, setLinkedRooms] = useState<LinkedRoomDraft[]>([]);

  const [guestId, setGuestId] = useState<number | undefined>(undefined);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [mealPlan, setMealPlan] = useState('room-only');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const hydrateBooking = (booking: any) => {
    const normalizedBooking = {
      ...booking,
      roomRate: Number(booking.roomRate || 0),
      subtotal: Number(booking.subtotal || 0),
      taxAmount: Number(booking.taxAmount || 0),
      serviceCharge: Number(booking.serviceCharge || 0),
      totalAmount: Number(booking.totalAmount || 0),
      advancePaid: Number(booking.advancePaid || 0),
      balanceDue: Number(booking.balanceDue || 0),
      bookingMeals: (booking.bookingMeals || []).map((bookingMeal: any) => ({
        ...bookingMeal,
        unitPrice: Number(bookingMeal.unitPrice || 0),
      })),
      invoices: (booking.invoices || []).map((invoice: any) => ({
        ...invoice,
        payments: (invoice.payments || []).map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount || 0),
        })),
      })),
    };

    setBookingData(normalizedBooking);
    setLinkedRooms((normalizedBooking.groupSummary?.bookings || [])
      .filter((linkedBooking: any) => linkedBooking.id !== normalizedBooking.id)
      .map((linkedBooking: any) => ({
        localId: 'existing-' + linkedBooking.id,
        roomTypeId: String(linkedBooking.roomTypeId),
        adults: String(linkedBooking.adults),
        children: String(linkedBooking.children),
        mealPlan: String(linkedBooking.mealPlan || '').replace(/_/g, '-'),
        selectedMeals: (linkedBooking.bookingMeals || []).map((bookingMeal: any) => ({
          mealPlanId: bookingMeal.mealPlan.id,
          name: bookingMeal.mealPlan.name,
          mealType: bookingMeal.mealPlan.mealType,
          price: Number(bookingMeal.unitPrice || 0),
          quantity: bookingMeal.quantity,
        })),
      })));
    setGuestId(normalizedBooking.guest.id);
    setFirstName(normalizedBooking.guest.firstName);
    setLastName(normalizedBooking.guest.lastName);
    setEmail(normalizedBooking.guest.email || '');
    setPhone(normalizedBooking.guest.phone || '');
    setNationality(normalizedBooking.guest.nationality || '');
    setIdNumber(normalizedBooking.guest.idNumber || '');
    setCheckIn(String(normalizedBooking.checkIn).slice(0, 10));
    setCheckOut(String(normalizedBooking.checkOut).slice(0, 10));
    setRoomTypeId(String(normalizedBooking.roomTypeId));
    setMealPlan(String(normalizedBooking.mealPlan).replace(/_/g, '-'));
    setAdults(String(normalizedBooking.adults));
    setChildren(String(normalizedBooking.children));
    setSpecialRequests(normalizedBooking.specialRequests || '');
    setSelectedMeals((normalizedBooking.bookingMeals || []).map((bookingMeal: any) => ({
      mealPlanId: bookingMeal.mealPlan.id,
      name: bookingMeal.mealPlan.name,
      mealType: bookingMeal.mealPlan.mealType,
      price: Number(bookingMeal.unitPrice),
      quantity: bookingMeal.quantity,
    })));
    setPaymentAmount(String(Math.max(normalizedBooking.balanceDue, 0)));
  };

  const loadStaticData = async () => {
    try {
      const roomTypeParams = checkIn && checkOut
        ? { checkIn, checkOut, ...(bookingIdNumber ? { excludeBookingId: bookingIdNumber } : {}) }
        : undefined;
      const [roomTypeData, mealPlanData] = await Promise.all([
        api.getRoomTypes(roomTypeParams),
        api.getMealPlans(),
      ]);

      setRoomTypes(roomTypeData.map((roomType: any) => ({ ...roomType, basePrice: Number(roomType.basePrice) })));
      setMealPlans(mealPlanData.map((plan: any) => ({ ...plan, price: Number(plan.price) })));
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load booking configuration');
    }
  };

  const loadBooking = async () => {
    if (!bookingIdNumber) return;

    try {
      setLoading(true);
      setError(null);
      const booking = await api.getBooking(bookingIdNumber);
      hydrateBooking(booking);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaticData();
  }, [checkIn, checkOut, bookingIdNumber]);

  useEffect(() => {
    if (!bookingIdNumber) return;
    void loadBooking();
  }, [bookingIdNumber]);

  const selectedRoomType = useMemo(() => roomTypes.find((roomType) => String(roomType.id) === roomTypeId), [roomTypeId, roomTypes]);
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const roomRate = selectedRoomType ? Number(selectedRoomType.basePrice) + getMealPlanSurcharge(selectedRoomType, mealPlan) : 0;
  const mealsTotal = selectedMeals.reduce((sum, meal) => sum + (meal.price * meal.quantity), 0);
  const subtotal = roomRate * nights + mealsTotal;
  const taxAmount = subtotal * 0.12;
  const serviceCharge = subtotal * 0.1;
  const totalAmount = subtotal + taxAmount + serviceCharge;
  const advancePaid = Number(bookingData?.advancePaid || 0);
  const predictedBalanceDue = Math.max(totalAmount - advancePaid, 0);
  const activeStatus = bookingData?.status || 'confirmed';
  const canEditBooking = activeStatus === 'confirmed';
  const canSettleBooking = Boolean(bookingData && !['cancelled', 'no_show'].includes(activeStatus));
  const paymentHistory = (bookingData?.invoices || []).flatMap((invoice: any) =>
    (invoice.payments || []).map((payment: any) => ({ ...payment, invoiceNumber: invoice.invoiceNumber })),
  );
  const linkedRoomSummaries = linkedRooms.map((room) => {
    const linkedRoomType = roomTypes.find((roomType) => String(roomType.id) === room.roomTypeId);
    const linkedRoomRate = linkedRoomType ? Number(linkedRoomType.basePrice) + getMealPlanSurcharge(linkedRoomType, room.mealPlan) : 0;
    const linkedMealsTotal = room.selectedMeals.reduce((sum, meal) => sum + (meal.price * meal.quantity), 0);
    const linkedSubtotal = linkedRoomRate * nights + linkedMealsTotal;
    const linkedTaxAmount = linkedSubtotal * 0.12;
    const linkedServiceCharge = linkedSubtotal * 0.1;
    const linkedRoomTotal = linkedSubtotal + linkedTaxAmount + linkedServiceCharge;
    return {
      ...room,
      roomType: linkedRoomType,
      mealsTotal: linkedMealsTotal,
      subtotal: linkedSubtotal,
      taxAmount: linkedTaxAmount,
      serviceCharge: linkedServiceCharge,
      totalAmount: linkedRoomTotal,
    };
  });
  const createGroupPricing = linkedRoomSummaries.reduce((sum, room) => ({
    subtotal: sum.subtotal + room.subtotal,
    taxAmount: sum.taxAmount + room.taxAmount,
    serviceCharge: sum.serviceCharge + room.serviceCharge,
    totalAmount: sum.totalAmount + room.totalAmount,
    addOnsTotal: sum.addOnsTotal + room.mealsTotal,
  }), {
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount,
    addOnsTotal: mealsTotal,
  });
  const createReservationTotal = createGroupPricing.totalAmount;
  const groupSummary = bookingData?.groupSummary
    ? {
        ...bookingData.groupSummary,
        totalAmount: Number(bookingData.groupSummary.totalAmount || 0),
        advancePaid: Number(bookingData.groupSummary.advancePaid || 0),
        balanceDue: Number(bookingData.groupSummary.balanceDue || 0),
        bookings: (bookingData.groupSummary.bookings || []).map((linkedBooking: any) => ({
          ...linkedBooking,
          totalAmount: Number(linkedBooking.totalAmount || 0),
          balanceDue: Number(linkedBooking.balanceDue || 0),
          bookingMeals: (linkedBooking.bookingMeals || []).map((bookingMeal: any) => ({
            ...bookingMeal,
            unitPrice: Number(bookingMeal.unitPrice || 0),
          })),
        })),
      }
    : null;
  const summaryAddOns = (isEditable
    ? selectedMeals.map((meal) => ({
        id: meal.mealPlanId,
        name: meal.name,
        quantity: meal.quantity,
        totalPrice: meal.price * meal.quantity,
      }))
    : (bookingData?.bookingMeals || []).map((bookingMeal: any) => ({
        id: bookingMeal.mealPlan.id,
        name: bookingMeal.mealPlan.name,
        quantity: bookingMeal.quantity,
        totalPrice: Number(bookingMeal.unitPrice || 0) * bookingMeal.quantity,
      }))
  );
  const summaryAddOnsTotal = summaryAddOns.reduce((sum: number, meal: any) => sum + meal.totalPrice, 0);
  const linkedRoomAddOns = isCreateMode
    ? linkedRoomSummaries.flatMap((room, index) => room.selectedMeals.map((meal) => ({
        id: room.localId + '-' + meal.mealPlanId,
        roomLabel: 'Room ' + (index + 2),
        name: meal.name,
        quantity: meal.quantity,
        totalPrice: meal.price * meal.quantity,
      })))
    : [];
  const summaryAddOnsLabel = isCreateMode && linkedRooms.length ? 'Main room add-ons' : 'Selected add-ons';
  const summaryDisplayedAddOnsTotal = isViewMode && bookingData
    ? summaryAddOnsTotal
    : linkedRooms.length
      ? createGroupPricing.addOnsTotal
      : mealsTotal;
  const summarySubtotalValue = isViewMode && bookingData
    ? bookingData.subtotal
    : linkedRooms.length
      ? createGroupPricing.subtotal
      : subtotal;
  const summaryTaxValue = isViewMode && bookingData
    ? bookingData.taxAmount
    : linkedRooms.length
      ? createGroupPricing.taxAmount
      : taxAmount;
  const summaryServiceChargeValue = isViewMode && bookingData
    ? bookingData.serviceCharge
    : linkedRooms.length
      ? createGroupPricing.serviceCharge
      : serviceCharge;
  const summaryTotalValue = isViewMode && bookingData
    ? bookingData.totalAmount
    : linkedRooms.length
      ? createGroupPricing.totalAmount
      : totalAmount;
  const summaryBalanceValue = isViewMode && bookingData
    ? bookingData.balanceDue
    : linkedRooms.length
      ? Math.max(createGroupPricing.totalAmount - advancePaid, 0)
      : predictedBalanceDue;
  const groupSummaryAddOns = (groupSummary?.bookings || []).flatMap((linkedBooking: any) => (
    (linkedBooking.bookingMeals || []).map((bookingMeal: any) => ({
      id: linkedBooking.id + '-' + bookingMeal.mealPlan.id,
      roomLabel: linkedBooking.room?.roomNumber
        ? 'Room ' + linkedBooking.room.roomNumber
        : linkedBooking.roomType?.name || ('Booking #' + linkedBooking.id),
      name: bookingMeal.mealPlan.name,
      quantity: bookingMeal.quantity,
      totalPrice: Number(bookingMeal.unitPrice || 0) * bookingMeal.quantity,
    }))
  ));
  const groupSummaryAddOnsTotal = groupSummaryAddOns.reduce((sum: number, meal: any) => sum + meal.totalPrice, 0);
  const existingGroupSize = groupSummary?.bookings?.length || 0;
  const showLinkedRoomsEditor = isCreateMode || (isEditMode && existingGroupSize > 1);
  const canReshapeLinkedRooms = isCreateMode;
  const isEditingReservationGroup = isEditMode && existingGroupSize > 1;

  const addMeal = (plan: MealPlanRecord) => {
    setSelectedMeals((current) => {
      const existing = current.find((meal) => meal.mealPlanId === plan.id);
      if (existing) {
        return current.map((meal) => meal.mealPlanId === plan.id ? { ...meal, quantity: meal.quantity + 1 } : meal);
      }
      return [...current, { mealPlanId: plan.id, name: plan.name, mealType: plan.mealType, price: plan.price, quantity: 1 }];
    });
  };

  const removeMeal = (mealPlanId: number) => {
    setSelectedMeals((current) => current.flatMap((meal) => {
      if (meal.mealPlanId !== mealPlanId) return [meal];
      if (meal.quantity === 1) return [];
      return [{ ...meal, quantity: meal.quantity - 1 }];
    }));
  };

  const addLinkedRoom = () => {
    setLinkedRooms((current) => [...current, createLinkedRoomDraft()]);
  };

  const updateLinkedRoom = (localId: string, field: keyof Omit<LinkedRoomDraft, 'localId' | 'selectedMeals'>, value: string) => {
    setLinkedRooms((current) => current.map((room) => room.localId === localId ? { ...room, [field]: value } : room));
  };

  const removeLinkedRoom = (localId: string) => {
    setLinkedRooms((current) => current.filter((room) => room.localId !== localId));
  };

  const addLinkedRoomMeal = (localId: string, plan: MealPlanRecord) => {
    setLinkedRooms((current) => current.map((room) => {
      if (room.localId !== localId) return room;
      const existing = room.selectedMeals.find((meal) => meal.mealPlanId === plan.id);
      return {
        ...room,
        selectedMeals: existing
          ? room.selectedMeals.map((meal) => meal.mealPlanId === plan.id ? { ...meal, quantity: meal.quantity + 1 } : meal)
          : [...room.selectedMeals, { mealPlanId: plan.id, name: plan.name, mealType: plan.mealType, price: plan.price, quantity: 1 }],
      };
    }));
  };

  const removeLinkedRoomMeal = (localId: string, mealPlanId: number) => {
    setLinkedRooms((current) => current.map((room) => {
      if (room.localId !== localId) return room;
      return {
        ...room,
        selectedMeals: room.selectedMeals.flatMap((meal) => {
          if (meal.mealPlanId !== mealPlanId) return [meal];
          if (meal.quantity === 1) return [];
          return [{ ...meal, quantity: meal.quantity - 1 }];
        }),
      };
    }));
  };

  const payload = {
    guest: { id: guestId, firstName, lastName, email, phone, nationality, idNumber },
    roomTypeId: Number(roomTypeId),
    roomId: bookingData?.roomId ?? undefined,
    checkIn,
    checkOut,
    nights,
    adults: Number(adults),
    children: Number(children),
    mealPlan,
    source: 'direct',
    specialRequests,
    additionalMeals: selectedMeals.map((meal) => ({ mealPlanId: meal.mealPlanId, quantity: meal.quantity, unitPrice: meal.price })),
  };
  const groupedPayload = {
    guest: payload.guest,
    checkIn,
    checkOut,
    nights,
    source: 'direct',
    specialRequests,
    rooms: [
      {
        ...(isEditingReservationGroup && bookingIdNumber ? { bookingId: bookingIdNumber } : {}),
        roomTypeId: Number(roomTypeId),
        adults: Number(adults),
        children: Number(children),
        mealPlan,
        additionalMeals: payload.additionalMeals,
      },
      ...linkedRooms.map((room) => ({
        ...(room.localId.startsWith('existing-') ? { bookingId: Number(room.localId.replace('existing-', '')) } : {}),
        roomTypeId: Number(room.roomTypeId),
        adults: Number(room.adults),
        children: Number(room.children),
        mealPlan: room.mealPlan,
        additionalMeals: room.selectedMeals.map((meal) => ({ mealPlanId: meal.mealPlanId, quantity: meal.quantity, unitPrice: meal.price })),
      })),
    ],
  };
  const savePayload = linkedRooms.length ? groupedPayload : payload;

  const handleSaveBooking = async () => {
    try {
      setSubmitting(true);
      setError(null);
      if (isCreateMode) {
        const createdBooking = await api.createBooking(savePayload);
        toast.success(linkedRooms.length ? 'Group reservation created successfully' : 'Booking created successfully');
        navigate(`/booking?id=${createdBooking.id}&mode=view`);
        return;
      }
      if (!bookingIdNumber) return;
      await api.updateBooking(bookingIdNumber, isEditingReservationGroup ? groupedPayload : payload);
      toast.success(isEditingReservationGroup ? 'Reservation group updated successfully' : 'Reservation updated successfully');
      navigate(`/booking?id=${bookingIdNumber}&mode=view`);
      await loadBooking();
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to save booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (nextStatus: 'cancelled' | 'no_show') => {
    if (!bookingIdNumber) return;
    try {
      setStatusSubmitting(true);
      setError(null);
      await api.updateBookingStatus(bookingIdNumber, nextStatus);
      toast.success(nextStatus === 'cancelled' ? 'Reservation cancelled' : 'Reservation marked as no-show');
      await loadBooking();
    } catch (statusError: any) {
      setError(statusError.message || 'Failed to update reservation status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!bookingIdNumber) return;
    try {
      setPaymentSubmitting(true);
      setError(null);
      const updatedBooking = await api.recordBookingPayment(bookingIdNumber, {
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNo: paymentReference || undefined,
        notes: paymentNotes || undefined,
      });
      hydrateBooking(updatedBooking);
      setPaymentReference('');
      setPaymentNotes('');
      toast.success('Payment recorded successfully');
    } catch (paymentError: any) {
      setError(paymentError.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading booking...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isCreateMode ? 'New Reservation Group' : isEditMode ? 'Edit Reservation' : 'Reservation Details'}</h1>
            <p className="mt-1 text-gray-500">{bookingData?.bookingRef ? `Booking reference: ${bookingData.bookingRef}` : 'Create one guest reservation and add one or more linked rooms under the same stay.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isCreateMode && <Badge className="bg-[#2B0A57] capitalize">{activeStatus.replace('_', ' ')}</Badge>}
          {groupSummary?.groupRef && <Badge variant="outline">Group {groupSummary.groupRef}</Badge>}
          {isViewMode && canEditBooking && <Button variant="outline" onClick={() => navigate(`/booking?id=${bookingIdNumber}&mode=edit`)}><Pencil className="mr-2 h-4 w-4" />Edit reservation</Button>}
          {isEditMode && <Button variant="outline" onClick={() => navigate(`/booking?id=${bookingIdNumber}&mode=view`)}>Cancel editing</Button>}
          {isViewMode && canEditBooking && <Button variant="outline" onClick={() => void handleStatusChange('no_show')} disabled={statusSubmitting}><UserX className="mr-2 h-4 w-4" />Mark no-show</Button>}
          {isViewMode && canEditBooking && <Button variant="destructive" onClick={() => void handleStatusChange('cancelled')} disabled={statusSubmitting}><Ban className="mr-2 h-4 w-4" />Cancel booking</Button>}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={!isEditable} /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={!isEditable} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isEditable} /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!isEditable} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="nationality">Nationality</Label><Input id="nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} disabled={!isEditable} /></div>
                <div className="space-y-2"><Label htmlFor="idNumber">ID / Passport Number</Label><Input id="idNumber" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} disabled={!isEditable} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Reservation Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="checkIn">Check-in Date</Label><Input id="checkIn" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} disabled={!isEditable} /></div>
                <div className="space-y-2"><Label htmlFor="checkOut">Check-out Date</Label><Input id="checkOut" type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} disabled={!isEditable} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Select value={adults} onValueChange={setAdults} disabled={!isEditable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Select value={children} onValueChange={setChildren} disabled={!isEditable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3, 4].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label htmlFor="nights">Nights</Label><Input id="nights" value={nights > 0 ? String(nights) : ''} disabled /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={roomTypeId} onValueChange={setRoomTypeId} disabled={!isEditable}>
                  <SelectTrigger><SelectValue placeholder="Select a room type" /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((roomType) => (
                      <SelectItem key={roomType.id} value={String(roomType.id)}>{roomType.name} - {formatCurrency(roomType.basePrice)} ({roomType.availableRooms}/{roomType.totalRooms} available)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mealPlan">Meal Plan</Label>
                  <Select value={mealPlan} onValueChange={setMealPlan} disabled={!isEditable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="room-only">Room Only</SelectItem><SelectItem value="bnb">Bed & Breakfast</SelectItem><SelectItem value="half-board">Half Board</SelectItem><SelectItem value="full-board">Full Board</SelectItem></SelectContent></Select>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">Assigned room</div>
                  <div className="mt-1">{bookingData?.room?.roomNumber || 'Not assigned yet'}</div>
                  <div className="mt-2 text-xs">Front desk can assign the room during arrival check-in if needed.</div>
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="specialRequests">Special Requests</Label><Textarea id="specialRequests" value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} disabled={!isEditable} className="min-h-[110px]" /></div>
              {showLinkedRoomsEditor && (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Linked rooms for the same guest</div>
                      <div className="text-sm text-slate-500">Use the same guest stay across multiple rooms. Existing groups can be edited room by room here.</div>
                    </div>
                    {canReshapeLinkedRooms ? <Button type="button" variant="outline" onClick={addLinkedRoom}><Plus className="mr-2 h-4 w-4" />Add another room</Button> : <Badge variant="outline">Room count locked after creation</Badge>}
                  </div>
                  {!!linkedRooms.length && (
                    <div className="space-y-3">
                      {linkedRoomSummaries.map((room, index) => (
                        <div key={room.localId} className="rounded-2xl border bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-900">Extra room {index + 2}</div>
                              <div className="text-xs text-slate-500">This creates a linked booking row under the same guest stay.</div>
                            </div>
                            {canReshapeLinkedRooms ? <Button type="button" variant="ghost" size="sm" onClick={() => removeLinkedRoom(room.localId)}><Trash2 className="mr-2 h-4 w-4" />Remove</Button> : <Badge variant="outline">Linked booking</Badge>}
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label>Room Type</Label>
                              <Select value={room.roomTypeId} onValueChange={(value) => updateLinkedRoom(room.localId, 'roomTypeId', value)}>
                                <SelectTrigger><SelectValue placeholder="Select a room type" /></SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map((roomTypeOption) => (
                                    <SelectItem key={roomTypeOption.id} value={String(roomTypeOption.id)}>{roomTypeOption.name} - {formatCurrency(roomTypeOption.basePrice)} ({roomTypeOption.availableRooms}/{roomTypeOption.totalRooms} available)</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Adults</Label>
                              <Select value={room.adults} onValueChange={(value) => updateLinkedRoom(room.localId, 'adults', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Children</Label>
                              <Select value={room.children} onValueChange={(value) => updateLinkedRoom(room.localId, 'children', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3, 4].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Meal Plan</Label>
                              <Select value={room.mealPlan} onValueChange={(value) => updateLinkedRoom(room.localId, 'mealPlan', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="room-only">Room Only</SelectItem><SelectItem value="bnb">Bed & Breakfast</SelectItem><SelectItem value="half-board">Half Board</SelectItem><SelectItem value="full-board">Full Board</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          {mealPlans.length > 0 && (
                            <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <div>
                                  <div className="font-medium text-slate-900">Room add-ons</div>
                                  <div className="text-xs text-slate-500">Optional extras for this linked room only.</div>
                                </div>
                                <div className="font-semibold text-slate-900">{formatCurrency(room.mealsTotal)}</div>
                              </div>
                              <div className="space-y-2">
                                {mealPlans.map((plan) => {
                                  const selected = room.selectedMeals.find((meal) => meal.mealPlanId === plan.id);
                                  return (
                                    <div key={plan.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                                      <div>
                                        <div className="font-medium text-sm text-slate-900">{plan.name}</div>
                                        <div className="text-xs capitalize text-slate-500">{plan.mealType.replace('_', ' ')} - {formatCurrency(plan.price)}</div>
                                      </div>
                                      {selected ? (
                                        <div className="flex items-center gap-2">
                                          <Button type="button" size="sm" variant="outline" onClick={() => removeLinkedRoomMeal(room.localId, plan.id)}><Minus className="h-3 w-3" /></Button>
                                          <span className="w-8 text-center font-semibold text-slate-900">{selected.quantity}</span>
                                          <Button type="button" size="sm" variant="outline" onClick={() => addLinkedRoomMeal(room.localId, plan)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                      ) : (
                                        <Button type="button" size="sm" variant="outline" onClick={() => addLinkedRoomMeal(room.localId, plan)}><Plus className="mr-1 h-3 w-3" />Add</Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm"><span className="text-slate-600">Estimated linked room total</span><span className="font-semibold text-[#2B0A57]">{formatCurrency(room.totalAmount)}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(isEditable || selectedMeals.length > 0) && mealPlans.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Additional Meals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {mealPlans.map((plan) => {
                  const selected = selectedMeals.find((meal) => meal.mealPlanId === plan.id);
                  return (
                    <div key={plan.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div>
                        <div className="font-medium text-sm">{plan.name}</div>
                        <div className="text-xs capitalize text-gray-500">{plan.mealType.replace('_', ' ')} - {formatCurrency(plan.price)}</div>
                      </div>
                      {isEditable ? (
                        selected ? <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => removeMeal(plan.id)}><Minus className="h-3 w-3" /></Button><span className="w-8 text-center font-semibold">{selected.quantity}</span><Button size="sm" variant="outline" onClick={() => addMeal(plan)}><Plus className="h-3 w-3" /></Button></div>
                        : <Button size="sm" variant="outline" onClick={() => addMeal(plan)}><Plus className="mr-1 h-3 w-3" />Add</Button>
                      ) : <Badge variant="outline">{selected ? `${selected.quantity} selected` : 'Not added'}</Badge>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{isCreateMode ? 'Group Reservation Summary' : 'Rate Summary'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedRoomType && nights > 0 ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Room Type</span><span className="font-medium">{selectedRoomType.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Nightly Rate</span><span className="font-medium">{formatCurrency(roomRate)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Nights</span><span className="font-medium">{nights}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Add-ons</span><span className="font-medium">{formatCurrency(summaryDisplayedAddOnsTotal)}</span></div>
                    {!!summaryAddOns.length && (
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="mb-2 font-medium text-slate-900">{summaryAddOnsLabel}</div>
                        <div className="space-y-2">
                          {summaryAddOns.map((meal: any) => (
                            <div key={meal.id} className="flex items-start justify-between gap-3">
                              <span>{meal.quantity} x {meal.name}</span>
                              <span className="whitespace-nowrap font-medium text-slate-900">{formatCurrency(meal.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!linkedRoomAddOns.length && (
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="mb-2 font-medium text-slate-900">Linked room add-ons</div>
                        <div className="space-y-2">
                          {linkedRoomAddOns.map((meal: any) => (
                            <div key={meal.id} className="flex items-start justify-between gap-3">
                              <span>{meal.roomLabel}: {meal.quantity} x {meal.name}</span>
                              <span className="whitespace-nowrap font-medium text-slate-900">{formatCurrency(meal.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-3"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(summarySubtotalValue)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tax (12%)</span><span className="font-medium">{formatCurrency(summaryTaxValue)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Service Charge (10%)</span><span className="font-medium">{formatCurrency(summaryServiceChargeValue)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Advance Paid</span><span className="font-medium text-emerald-700">{formatCurrency(advancePaid)}</span></div>{isCreateMode && !!linkedRooms.length && <div className="flex justify-between"><span className="text-gray-600">Linked rooms</span><span className="font-medium">{linkedRooms.length + 1}</span></div>}
                    <div className="flex justify-between border-t pt-3 text-base font-bold"><span>{isCreateMode && linkedRooms.length ? 'Combined Total' : 'Total'}</span><span className="text-[#2B0A57]">{formatCurrency(summaryTotalValue)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Balance Due</span><span className="font-semibold text-amber-700">{formatCurrency(summaryBalanceValue)}</span></div>
                  </div>
                  {isEditable && <Button className="w-full bg-[#2B0A57] hover:bg-[#2B0A57]/90" onClick={() => void handleSaveBooking()} disabled={submitting || !firstName || !lastName || !checkIn || !checkOut || !roomTypeId || linkedRooms.some((room) => !room.roomTypeId)}>{submitting ? 'Saving reservation...' : isCreateMode ? (linkedRooms.length ? 'Confirm group booking' : 'Confirm Booking') : <><Save className="mr-2 h-4 w-4" />Save changes</>}</Button>}
                </>
              ) : <div className="py-8 text-center text-sm text-gray-500">Select dates and a room type to calculate pricing.</div>}
            </CardContent>
          </Card>
          {!isCreateMode && groupSummary && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Group Reservation Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Group ref</div><div className="mt-1 font-semibold text-slate-900">{groupSummary.groupRef || ('Group #' + groupSummary.id)}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Linked rooms</div><div className="mt-1 font-semibold text-slate-900">{groupSummary.bookings.length}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Combined total</div><div className="mt-1 font-semibold text-slate-900">{formatCurrency(groupSummary.totalAmount)}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Combined balance</div><div className="mt-1 font-semibold text-amber-700">{formatCurrency(groupSummary.balanceDue)}</div></div>
                </div>
                <div className="rounded-2xl border bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">Group add-ons</div>
                      <div className="text-xs text-slate-500">Meals and extras attached across every linked room.</div>
                    </div>
                    <div className="text-right font-semibold text-slate-900">{formatCurrency(groupSummaryAddOnsTotal)}</div>
                  </div>
                  {groupSummaryAddOns.length ? (
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      {groupSummaryAddOns.map((meal: any) => (
                        <div key={meal.id} className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2">
                          <span>{meal.roomLabel}: {meal.quantity} x {meal.name}</span>
                          <span className="whitespace-nowrap font-medium text-slate-900">{formatCurrency(meal.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500">No meal add-ons have been attached to this reservation group yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {!isCreateMode && bookingData && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Reservation Status</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600">Current Status</span><Badge className="capitalize">{activeStatus.replace('_', ' ')}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Assigned Room</span><span className="font-semibold">{bookingData.room?.roomNumber || 'Pending assignment'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Check-in</span><span className="font-medium">{new Date(bookingData.checkIn).toLocaleDateString()}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Check-out</span><span className="font-medium">{new Date(bookingData.checkOut).toLocaleDateString()}</span></div>
              </CardContent>
            </Card>
          )}

          {!isCreateMode && bookingData && canSettleBooking && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4" />Front Desk Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-600">Outstanding balance</span><span className="text-lg font-semibold text-slate-900">{formatCurrency(bookingData.balanceDue)}</span></div>
                  <div className="mt-1 text-xs text-slate-500">Record deposits or settlement here before the guest reaches checkout.</div>
                </div>
                {bookingData.balanceDue > 0 ? (
                  <>
                    <div className="space-y-2"><Label htmlFor="paymentAmount">Amount</Label><Input id="paymentAmount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /></div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="paymentReference">Reference No</Label><Input id="paymentReference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional reference" /></div>
                    <div className="space-y-2"><Label htmlFor="paymentNotes">Notes</Label><Textarea id="paymentNotes" value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Optional payment note" className="min-h-[90px]" /></div>
                    <Button className="w-full bg-[#2B0A57] hover:bg-[#2B0A57]/90" onClick={() => void handleRecordPayment()} disabled={paymentSubmitting || Number(paymentAmount) <= 0}>{paymentSubmitting ? 'Recording payment...' : 'Record payment'}</Button>
                  </>
                ) : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">This reservation is fully paid and ready for front-desk checkout when the guest departs.</div>}
              </CardContent>
            </Card>
          )}

          {!isCreateMode && bookingData && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Payment History</CardTitle></CardHeader>
              <CardContent>
                {paymentHistory.length ? (
                  <div className="space-y-3">
                    {paymentHistory.map((payment: any) => (
                      <div key={payment.id} className="rounded-2xl border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium capitalize">{payment.paymentMethod.replace('_', ' ')}</div>
                            <div className="text-xs text-slate-500">{new Date(payment.paymentDate).toLocaleString()}</div>
                          </div>
                          <div className="text-right font-semibold">{formatCurrency(payment.amount)}</div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Invoice: {payment.invoiceNumber}</div>
                        {payment.referenceNo && <div className="mt-1 text-xs text-slate-500">Ref: {payment.referenceNo}</div>}
                        {payment.notes && <div className="mt-1 text-xs text-slate-500">{payment.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : <div className="text-sm text-slate-500">No payments recorded yet.</div>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


