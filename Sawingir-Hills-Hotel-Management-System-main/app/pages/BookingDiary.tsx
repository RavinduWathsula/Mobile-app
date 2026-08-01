import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BedDouble,
  Calendar as CalendarIcon,
  CircleDollarSign,
  CreditCard,
  Edit,
  Eye,
  Mail,
  Phone,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ROOMS = [
  { number: "101", type: "Deluxe", floor: 1 },
  { number: "102", type: "Deluxe", floor: 1 },
  { number: "103", type: "Suite", floor: 1 },
  { number: "201", type: "Standard", floor: 2 },
  { number: "202", type: "Standard", floor: 2 },
  { number: "203", type: "Family", floor: 2 },
  { number: "301", type: "Deluxe", floor: 3 },
  { number: "302", type: "Suite", floor: 3 },
] as const;

const DAYS_IN_VIEW = 31;
const TODAY = 7;
const ROOM_COLUMN_WIDTH = 188;
const DAY_COLUMN_WIDTH = 44;
const MONTH_LABEL = "March 2026";

interface Booking {
  id: number;
  room: string;
  guest: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "checked-in" | "checked-out";
  roomType: string;
  mealPlan: string;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  individualMeals: Array<{
    name: string;
    type: string;
    price: number;
    quantity: number;
  }>;
}

const BOOKINGS: Booking[] = [
  {
    id: 1,
    room: "101",
    guest: "John Smith",
    email: "john.smith@email.com",
    phone: "+94 77 123 4567",
    checkIn: "2026-03-05",
    checkOut: "2026-03-10",
    status: "confirmed",
    roomType: "Single Room",
    mealPlan: "Bed & Breakfast",
    adults: 1,
    children: 0,
    totalAmount: 80000,
    paidAmount: 40000,
    individualMeals: [],
  },
  {
    id: 2,
    room: "102",
    guest: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+94 71 234 5678",
    checkIn: "2026-03-06",
    checkOut: "2026-03-09",
    status: "confirmed",
    roomType: "Double Room",
    mealPlan: "Half Board",
    adults: 2,
    children: 0,
    totalAmount: 60000,
    paidAmount: 60000,
    individualMeals: [
      { name: "Sri Lankan Rice & Curry", type: "Lunch", price: 1800, quantity: 2 },
    ],
  },
  {
    id: 3,
    room: "103",
    guest: "Michael Brown",
    email: "m.brown@email.com",
    phone: "+94 76 345 6789",
    checkIn: "2026-03-04",
    checkOut: "2026-03-12",
    status: "checked-in",
    roomType: "Triple Room",
    mealPlan: "Full Board",
    adults: 3,
    children: 1,
    totalAmount: 264000,
    paidAmount: 150000,
    individualMeals: [],
  },
  {
    id: 4,
    room: "201",
    guest: "Emma Davis",
    email: "emma.davis@email.com",
    phone: "+94 77 987 6543",
    checkIn: "2026-03-07",
    checkOut: "2026-03-11",
    status: "confirmed",
    roomType: "Double Room",
    mealPlan: "Room Only",
    adults: 2,
    children: 0,
    totalAmount: 48000,
    paidAmount: 20000,
    individualMeals: [
      { name: "English Breakfast", type: "Breakfast", price: 1900, quantity: 8 },
      { name: "Flame & Feast Dinner", type: "Dinner", price: 2400, quantity: 4 },
    ],
  },
  {
    id: 5,
    room: "301",
    guest: "David Wilson",
    email: "d.wilson@email.com",
    phone: "+94 70 111 2233",
    checkIn: "2026-03-03",
    checkOut: "2026-03-08",
    status: "checked-in",
    roomType: "Honeymoon Suite",
    mealPlan: "Full Board (Included)",
    adults: 2,
    children: 0,
    totalAmount: 135000,
    paidAmount: 135000,
    individualMeals: [],
  },
];

const STATUS_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-500 text-white",
  "checked-in": "bg-primary text-primary-foreground",
  "checked-out": "bg-slate-500 text-white",
};

const STATUS_LABELS: Record<Booking["status"], string> = {
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
};

function getDayNumber(value: string) {
  return Number.parseInt(value.slice(-2), 10);
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMoney(value: number) {
  return `LKR ${value.toLocaleString()}`;
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPaymentRatio(booking: Booking) {
  if (booking.totalAmount <= 0) return 0;
  return Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100));
}

function getBalance(booking: Booking) {
  return booking.totalAmount - booking.paidAmount;
}

function getBookingSpan(booking: Booking) {
  const startDay = Math.max(1, getDayNumber(booking.checkIn));
  const endDay = Math.min(DAYS_IN_VIEW, getDayNumber(booking.checkOut));
  return {
    startDay,
    endDay,
    span: Math.max(1, endDay - startDay + 1),
  };
}

function isBookingActiveOnDay(booking: Booking, day: number) {
  const { startDay, endDay } = getBookingSpan(booking);
  return day >= startDay && day <= endDay;
}

export function BookingDiary() {
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(BOOKINGS[0]?.id ?? null);

  const filteredRooms = useMemo(
    () => (selectedFloor === "all" ? ROOMS : ROOMS.filter((room) => room.floor.toString() === selectedFloor)),
    [selectedFloor],
  );

  const visibleBookings = useMemo(
    () => BOOKINGS.filter((booking) => filteredRooms.some((room) => room.number === booking.room)),
    [filteredRooms],
  );

  const selectedBooking = useMemo(
    () => visibleBookings.find((booking) => booking.id === selectedBookingId) ?? visibleBookings[0] ?? null,
    [selectedBookingId, visibleBookings],
  );

  const occupiedTodayCount = visibleBookings.filter((booking) => isBookingActiveOnDay(booking, selectedDay)).length;
  const arrivalsThisWeek = visibleBookings.filter((booking) => {
    const checkInDay = getDayNumber(booking.checkIn);
    return checkInDay >= selectedDay && checkInDay <= selectedDay + 6;
  }).length;
  const checkedInCount = visibleBookings.filter((booking) => booking.status === "checked-in").length;
  const outstandingTotal = visibleBookings.reduce((total, booking) => total + getBalance(booking), 0);
  const timelineWidth = DAYS_IN_VIEW * DAY_COLUMN_WIDTH;

  const handleEditBooking = (bookingId: number) => {
    navigate(`/booking?id=${bookingId}&mode=edit`);
  };

  const handleViewBooking = (bookingId: number) => {
    navigate(`/booking?id=${bookingId}&mode=view`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <Badge variant="outline" className="w-fit border-primary/15 bg-primary/8 text-primary">
            Front office planning board
          </Badge>
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground">Booking Diary</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A cleaner month-view occupancy board for reservations, arrivals, and guest follow-up. Click any stay block to inspect the booking without leaving the diary.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Month</div>
            <div className="mt-1 font-semibold text-foreground">{MONTH_LABEL}</div>
          </div>
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Export calendar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Rooms in view</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{filteredRooms.length}</div>
                <div className="mt-1 text-sm text-muted-foreground">Filtered by floor selection</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <BedDouble className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Occupied on day {selectedDay}</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{occupiedTodayCount}</div>
                <div className="mt-1 text-sm text-muted-foreground">Rooms blocked on the current focus date</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Upcoming arrivals</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{arrivalsThisWeek}</div>
                <div className="mt-1 text-sm text-muted-foreground">Arriving within the next 7 days</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Outstanding balance</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{formatMoney(outstandingTotal)}</div>
                <div className="mt-1 text-sm text-muted-foreground">Across {checkedInCount} in-house stays</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <CardTitle>Occupancy board</CardTitle>
                <CardDescription>
                  Select a day or booking bar to inspect the stay. The board stays readable for front-office staff even when the month view gets busy.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full min-w-[180px] sm:w-auto">
                  <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                    <SelectTrigger className="h-10 bg-background">
                      <SelectValue placeholder="Filter by floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All floors</SelectItem>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                      <SelectItem value="3">Floor 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  Focus day <span className="font-semibold text-foreground">{selectedDay} Mar</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-primary" />
                Checked in
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                Confirmed
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-slate-500" />
                Checked out
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-primary/25 bg-primary/8" />
                Selected day
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="sticky top-0 z-20 flex border-b border-border bg-card">
                  <div
                    className="sticky left-0 z-30 flex shrink-0 items-center border-r border-border bg-card px-4 py-3"
                    style={{ width: ROOM_COLUMN_WIDTH }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">Room</div>
                      <div className="text-xs text-muted-foreground">Type and floor</div>
                    </div>
                  </div>
                  <div className="flex" style={{ width: timelineWidth }}>
                    {Array.from({ length: DAYS_IN_VIEW }, (_, index) => index + 1).map((day) => {
                      const isSelected = day === selectedDay;
                      const isToday = day === TODAY;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`flex h-14 flex-col items-center justify-center border-r border-border text-xs transition-colors ${
                            isSelected
                              ? "bg-primary/8 text-primary"
                              : isToday
                              ? "bg-secondary/65 text-foreground"
                              : "bg-card text-muted-foreground hover:bg-accent/60"
                          }`}
                          style={{ width: DAY_COLUMN_WIDTH }}
                        >
                          <span className="font-semibold">{day}</span>
                          <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em]">
                            {isToday ? "Today" : "Mar"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {filteredRooms.map((room) => {
                    const roomBookings = visibleBookings
                      .filter((booking) => booking.room === room.number)
                      .sort((left, right) => left.checkIn.localeCompare(right.checkIn));

                    return (
                      <div key={room.number} className="flex bg-card">
                        <div
                          className="sticky left-0 z-10 flex shrink-0 items-center border-r border-border bg-card px-4 py-3"
                          style={{ width: ROOM_COLUMN_WIDTH }}
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">Room {room.number}</div>
                            <div className="text-xs text-muted-foreground">{room.type} / Floor {room.floor}</div>
                          </div>
                        </div>

                        <div className="relative h-[68px] shrink-0" style={{ width: timelineWidth }}>
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: DAYS_IN_VIEW }, (_, index) => index + 1).map((day) => (
                              <div
                                key={`${room.number}-${day}`}
                                className={`border-r border-border ${day === selectedDay ? "bg-primary/6" : day === TODAY ? "bg-secondary/40" : "bg-transparent"}`}
                                style={{ width: DAY_COLUMN_WIDTH }}
                              />
                            ))}
                          </div>

                          {roomBookings.length === 0 ? (
                            <div className="absolute inset-y-0 left-4 flex items-center text-xs text-muted-foreground">
                              Available all month
                            </div>
                          ) : (
                            roomBookings.map((booking) => {
                              const { startDay, span } = getBookingSpan(booking);
                              const isSelectedBooking = selectedBooking?.id === booking.id;
                              return (
                                <button
                                  key={booking.id}
                                  type="button"
                                  onClick={() => setSelectedBookingId(booking.id)}
                                  className={`absolute top-3 flex h-10 items-center rounded-lg px-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.14)] transition-transform hover:-translate-y-0.5 ${STATUS_STYLES[booking.status]} ${isSelectedBooking ? "ring-2 ring-offset-1 ring-primary/35" : ""}`}
                                  style={{
                                    left: (startDay - 1) * DAY_COLUMN_WIDTH + 4,
                                    width: span * DAY_COLUMN_WIDTH - 8,
                                  }}
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold">{booking.guest}</div>
                                    <div className="truncate text-[11px] opacity-85">{booking.roomType}</div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>Reservation inspector</CardTitle>
            <CardDescription>
              Keep this panel open while scanning the diary so staff can verify guest, payment, and stay details without leaving the month board.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {selectedBooking ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold tracking-[-0.02em] text-foreground">{selectedBooking.guest}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Room {selectedBooking.room} / {selectedBooking.roomType}
                      </div>
                    </div>
                    <Badge className={STATUS_STYLES[selectedBooking.status]}>
                      {STATUS_LABELS[selectedBooking.status]}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Check-in</div>
                        <div className="mt-1 font-medium text-foreground">{formatFullDate(selectedBooking.checkIn)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Check-out</div>
                        <div className="mt-1 font-medium text-foreground">{formatFullDate(selectedBooking.checkOut)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Nights</div>
                        <div className="mt-1 font-medium text-foreground">{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Guests</div>
                        <div className="mt-1 font-medium text-foreground">
                          {selectedBooking.adults} adult{selectedBooking.adults > 1 ? "s" : ""}
                          {selectedBooking.children ? ` / ${selectedBooking.children} child${selectedBooking.children > 1 ? "ren" : ""}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Guest contact</div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="min-w-0 truncate text-foreground">{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    Meal setup
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground">
                    {selectedBooking.mealPlan}
                  </div>
                  {selectedBooking.individualMeals.length > 0 && (
                    <div className="space-y-2">
                      {selectedBooking.individualMeals.map((meal) => (
                        <div key={`${selectedBooking.id}-${meal.name}`} className="rounded-lg border border-border bg-background px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">{meal.name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{meal.type}</div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium text-foreground">Qty {meal.quantity}</div>
                              <div className="mt-1 text-muted-foreground">{formatMoney(meal.price * meal.quantity)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment summary
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Paid so far</span>
                      <span className="font-semibold text-foreground">{getPaymentRatio(selectedBooking)}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${getPaymentRatio(selectedBooking)}%` }}
                      />
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total amount</span>
                        <span className="font-medium text-foreground">{formatMoney(selectedBooking.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-emerald-600">{formatMoney(selectedBooking.paidAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2.5">
                        <span className="font-medium text-foreground">Balance due</span>
                        <span className="font-semibold text-amber-600">{formatMoney(getBalance(selectedBooking))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Button onClick={() => handleEditBooking(selectedBooking.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit booking
                  </Button>
                  <Button variant="outline" onClick={() => handleViewBooking(selectedBooking.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View full details
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                Select a booking bar from the diary to review reservation details here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

