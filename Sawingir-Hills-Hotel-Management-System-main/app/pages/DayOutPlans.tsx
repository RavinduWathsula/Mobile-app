import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle,
  Clock,
  Palmtree,
  UserPlus,
} from "lucide-react";

type TabValue = "plans" | "reservations" | "bookings" | "reports";

interface DayOutPlan {
  id: number;
  name: string;
  description: string;
  adultPrice: number;
  childPrice: number;
  includes: string[];
  schedule: string;
  timing: string;
  recurring: "weekly" | "once" | "custom";
  recurringDay?: string;
  date?: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface DayOutBooking {
  id: number;
  planId: number;
  planName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number;
  children: number;
  totalAmount: number;
  bookingDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  specialRequests?: string;
  createdAt: string;
}

const initialPlans: DayOutPlan[] = [
  {
    id: 1,
    name: "Sunday Buffet & Pool",
    description: "Enjoy a mouth-watering international buffet, refreshing iced coffee with cake, and free pool access",
    adultPrice: 3400,
    childPrice: 2550,
    includes: ["International Buffet", "Iced Coffee & Cake", "Free Pool Access"],
    schedule: "Every Sunday",
    timing: "9:00 AM - 4:00 PM",
    recurring: "weekly",
    recurringDay: "Sunday",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Sawingir Awurudu Wasanthaya",
    description: "Celebrate Sinhala & Tamil New Year with family, friends, or office team",
    adultPrice: 3550,
    childPrice: 3000,
    includes: [
      "Welcome Drink",
      "Awurudu Kreeda (Traditional Games)",
      "Special Lunch Buffet",
      "Evening Iced Coffee & Cake",
      "Full Day Pool Access",
    ],
    schedule: "Every Sunday in April",
    timing: "9:00 AM - 4:00 PM",
    recurring: "custom",
    status: "active",
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Her Day at Sawingir Hills",
    description: "Special celebration day for ladies",
    adultPrice: 3000,
    childPrice: 2500,
    includes: ["Welcome Drink", "Special Lunch Buffet", "Pool Access", "Special Activities"],
    schedule: "Monthly Event",
    timing: "10:00 AM - 5:00 PM",
    recurring: "custom",
    status: "active",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

export function DayOutPlans() {
  const [activeTab, setActiveTab] = useState<TabValue>("plans");
  const [plans, setPlans] = useState<DayOutPlan[]>([]);
  const [bookings, setBookings] = useState<DayOutBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<DayOutBooking[]>([]);

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DayOutPlan | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Plan form state
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    adultPrice: "",
    childPrice: "",
    includes: "",
    schedule: "",
    timing: "",
    recurring: "weekly" as "weekly" | "once" | "custom",
    recurringDay: "Sunday",
    date: "",
  });

  // Reservation form state
  const [reservationForm, setReservationForm] = useState({
    planId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    adults: "1",
    children: "0",
    bookingDate: "",
    specialRequests: "",
  });

  // Load data
  useEffect(() => {
    const loadedPlans = JSON.parse(localStorage.getItem("dayOutPlans") || "[]");
    const loadedBookings = JSON.parse(localStorage.getItem("dayOutBookings") || "[]");

    if (loadedPlans.length === 0) {
      localStorage.setItem("dayOutPlans", JSON.stringify(initialPlans));
      setPlans(initialPlans);
    } else {
      setPlans(loadedPlans);
    }

    setBookings(loadedBookings);
  }, []);

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.guestPhone.includes(searchQuery) ||
          b.planName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);

  const handleOpenPlanDialog = (plan?: DayOutPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description,
        adultPrice: plan.adultPrice.toString(),
        childPrice: plan.childPrice.toString(),
        includes: plan.includes.join("\n"),
        schedule: plan.schedule,
        timing: plan.timing,
        recurring: plan.recurring,
        recurringDay: plan.recurringDay || "Sunday",
        date: plan.date || "",
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "",
        description: "",
        adultPrice: "",
        childPrice: "",
        includes: "",
        schedule: "",
        timing: "",
        recurring: "weekly",
        recurringDay: "Sunday",
        date: "",
      });
    }
    setIsPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    const planData: DayOutPlan = {
      id: editingPlan?.id || Date.now(),
      name: planForm.name,
      description: planForm.description,
      adultPrice: parseInt(planForm.adultPrice),
      childPrice: parseInt(planForm.childPrice),
      includes: planForm.includes.split("\n").filter((i) => i.trim() !== ""),
      schedule: planForm.schedule,
      timing: planForm.timing,
      recurring: planForm.recurring,
      recurringDay: planForm.recurringDay,
      date: planForm.date,
      status: editingPlan?.status || "active",
      createdAt: editingPlan?.createdAt || new Date().toISOString(),
    };

    let updatedPlans;
    if (editingPlan) {
      updatedPlans = plans.map((p) => (p.id === editingPlan.id ? planData : p));
    } else {
      updatedPlans = [...plans, planData];
    }

    setPlans(updatedPlans);
    localStorage.setItem("dayOutPlans", JSON.stringify(updatedPlans));
    setIsPlanDialogOpen(false);
  };

  const handleDeletePlan = (planId: number) => {
    if (!confirm("Are you sure you want to delete this day out plan?")) return;

    const updatedPlans = plans.filter((p) => p.id !== planId);
    setPlans(updatedPlans);
    localStorage.setItem("dayOutPlans", JSON.stringify(updatedPlans));
  };

  const handleTogglePlanStatus = (planId: number) => {
    const updatedPlans = plans.map((p) =>
      p.id === planId ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
    );
    setPlans(updatedPlans);
    localStorage.setItem("dayOutPlans", JSON.stringify(updatedPlans));
  };

  const handleOpenReservation = () => {
    setReservationForm({
      planId: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      adults: "1",
      children: "0",
      bookingDate: "",
      specialRequests: "",
    });
    setIsReservationDialogOpen(true);
  };

  const handleSaveReservation = () => {
    const selectedPlan = plans.find((p) => p.id === parseInt(reservationForm.planId));
    if (!selectedPlan) return;

    const adults = parseInt(reservationForm.adults);
    const children = parseInt(reservationForm.children);
    const totalAmount = adults * selectedPlan.adultPrice + children * selectedPlan.childPrice;

    const booking: DayOutBooking = {
      id: Date.now(),
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      guestName: reservationForm.guestName,
      guestEmail: reservationForm.guestEmail,
      guestPhone: reservationForm.guestPhone,
      adults,
      children,
      totalAmount,
      bookingDate: reservationForm.bookingDate,
      status: "confirmed",
      paymentStatus: "pending",
      specialRequests: reservationForm.specialRequests,
      createdAt: new Date().toISOString(),
    };

    const updatedBookings = [...bookings, booking];
    setBookings(updatedBookings);
    localStorage.setItem("dayOutBookings", JSON.stringify(updatedBookings));
    setIsReservationDialogOpen(false);
    alert("Reservation created successfully!");
  };

  const handleUpdateBookingStatus = (bookingId: number, newStatus: DayOutBooking["status"]) => {
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
    setBookings(updatedBookings);
    localStorage.setItem("dayOutBookings", JSON.stringify(updatedBookings));
  };

  const handleUpdatePaymentStatus = (bookingId: number, newStatus: DayOutBooking["paymentStatus"]) => {
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, paymentStatus: newStatus } : b
    );
    setBookings(updatedBookings);
    localStorage.setItem("dayOutBookings", JSON.stringify(updatedBookings));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-violet-500">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "refunded":
        return <Badge className="bg-orange-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate reports
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const totalGuests = bookings.reduce((sum, b) => sum + b.adults + b.children, 0);
  const todayArrivals = bookings.filter(
    (b) =>
      b.bookingDate === new Date().toISOString().split("T")[0] &&
      (b.status === "confirmed" || b.status === "completed")
  ).length;

  const tabs = [
    { value: "plans" as const, label: "Day Out Plans" },
    { value: "reservations" as const, label: "Make Reservation" },
    { value: "bookings" as const, label: "Bookings List" },
    { value: "reports" as const, label: "Reports & Analytics" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Day Out Plans</h1>
        <p className="text-gray-500 mt-1">
          Manage day out packages, reservations, and bookings
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActive
                    ? "border-[#2B0A57] text-[#2B0A57]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                className="bg-[#2B0A57] hover:bg-[#3d1570]"
                onClick={() => handleOpenPlanDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Day Out Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      {getStatusBadge(plan.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Adult Price:</span>
                        <span className="font-semibold">LKR {plan.adultPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Child Price:</span>
                        <span className="font-semibold">LKR {plan.childPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">Package Includes:</p>
                      <ul className="space-y-1">
                        {plan.includes.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                        {plan.includes.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{plan.includes.length - 3} more items
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{plan.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{plan.timing}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenPlanDialog(plan)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePlanStatus(plan.id)}
                        className={
                          plan.status === "active"
                            ? "text-orange-600 border-orange-600"
                            : "text-green-600 border-green-600"
                        }
                      >
                        {plan.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Make New Reservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Select Day Out Plan</Label>
                    <Select
                      value={reservationForm.planId}
                      onValueChange={(value) =>
                        setReservationForm({ ...reservationForm, planId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans
                          .filter((p) => p.status === "active")
                          .map((plan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name} - LKR {plan.adultPrice} (Adult) / LKR{" "}
                              {plan.childPrice} (Child)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guest-name">Guest Name</Label>
                      <Input
                        id="guest-name"
                        value={reservationForm.guestName}
                        onChange={(e) =>
                          setReservationForm({ ...reservationForm, guestName: e.target.value })
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-phone">Phone Number</Label>
                      <Input
                        id="guest-phone"
                        value={reservationForm.guestPhone}
                        onChange={(e) =>
                          setReservationForm({ ...reservationForm, guestPhone: e.target.value })
                        }
                        placeholder="077 123 4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      value={reservationForm.guestEmail}
                      onChange={(e) =>
                        setReservationForm({ ...reservationForm, guestEmail: e.target.value })
                      }
                      placeholder="guest@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adults">Number of Adults</Label>
                      <Input
                        id="adults"
                        type="number"
                        min="1"
                        value={reservationForm.adults}
                        onChange={(e) =>
                          setReservationForm({ ...reservationForm, adults: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="children">Number of Children</Label>
                      <Input
                        id="children"
                        type="number"
                        min="0"
                        value={reservationForm.children}
                        onChange={(e) =>
                          setReservationForm({ ...reservationForm, children: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-date">Booking Date</Label>
                      <Input
                        id="booking-date"
                        type="date"
                        value={reservationForm.bookingDate}
                        onChange={(e) =>
                          setReservationForm({ ...reservationForm, bookingDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {reservationForm.planId && (
                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-violet-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-violet-900">
                          LKR{" "}
                          {(
                            parseInt(reservationForm.adults || "0") *
                              plans.find((p) => p.id === parseInt(reservationForm.planId))
                                ?.adultPrice! +
                            parseInt(reservationForm.children || "0") *
                              plans.find((p) => p.id === parseInt(reservationForm.planId))
                                ?.childPrice!
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                    <Textarea
                      id="special-requests"
                      value={reservationForm.specialRequests}
                      onChange={(e) =>
                        setReservationForm({
                          ...reservationForm,
                          specialRequests: e.target.value,
                        })
                      }
                      placeholder="Any special requirements or requests"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setReservationForm({
                        planId: "",
                        guestName: "",
                        guestEmail: "",
                        guestPhone: "",
                        adults: "1",
                        children: "0",
                        bookingDate: "",
                        specialRequests: "",
                      })
                    }
                  >
                    Clear Form
                  </Button>
                  <Button
                    className="bg-[#2B0A57] hover:bg-[#3d1570]"
                    onClick={handleSaveReservation}
                  >
                    Create Reservation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings List Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by guest name, email, phone, or plan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bookings</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Guest Details</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">#{booking.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{booking.guestName}</p>
                              <p className="text-xs text-gray-500">{booking.guestEmail}</p>
                              <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{booking.planName}</TableCell>
                          <TableCell>{booking.bookingDate}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{booking.adults} Adults</p>
                              <p>{booking.children} Children</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            LKR {booking.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>{getStatusBadge(booking.paymentStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {booking.paymentStatus === "pending" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleUpdatePaymentStatus(booking.id, "paid")}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {booking.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold">{totalBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">LKR {totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Guests</p>
                      <p className="text-2xl font-bold">{totalGuests}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Palmtree className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Today's Arrivals</p>
                      <p className="text-2xl font-bold">{todayArrivals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const planBookings = bookings.filter((b) => b.planId === plan.id);
                    const planRevenue = planBookings
                      .filter((b) => b.paymentStatus === "paid")
                      .reduce((sum, b) => sum + b.totalAmount, 0);

                    return (
                      <div
                        key={plan.id}
                        className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-gray-500">
                            {planBookings.length} bookings •{" "}
                            {planBookings.reduce((sum, b) => sum + b.adults + b.children, 0)} total
                            guests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            LKR {planRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Day Out Plan" : "Create New Day Out Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure day out package details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g., Sunday Buffet & Pool"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Brief description of the day out plan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adult-price">Adult Price (LKR)</Label>
                <Input
                  id="adult-price"
                  type="number"
                  value={planForm.adultPrice}
                  onChange={(e) => setPlanForm({ ...planForm, adultPrice: e.target.value })}
                  placeholder="3400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="child-price">Child Price (LKR)</Label>
                <Input
                  id="child-price"
                  type="number"
                  value={planForm.childPrice}
                  onChange={(e) => setPlanForm({ ...planForm, childPrice: e.target.value })}
                  placeholder="2550"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="includes">Package Includes (one per line)</Label>
              <Textarea
                id="includes"
                value={planForm.includes}
                onChange={(e) => setPlanForm({ ...planForm, includes: e.target.value })}
                placeholder="International Buffet&#10;Iced Coffee & Cake&#10;Free Pool Access"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  value={planForm.schedule}
                  onChange={(e) => setPlanForm({ ...planForm, schedule: e.target.value })}
                  placeholder="Every Sunday"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timing">Timing</Label>
                <Input
                  id="timing"
                  value={planForm.timing}
                  onChange={(e) => setPlanForm({ ...planForm, timing: e.target.value })}
                  placeholder="9:00 AM - 4:00 PM"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring Type</Label>
                <Select
                  value={planForm.recurring}
                  onValueChange={(value: "weekly" | "once" | "custom") =>
                    setPlanForm({ ...planForm, recurring: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly (Every Week)</SelectItem>
                    <SelectItem value="once">One-Time Event</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {planForm.recurring === "weekly" && (
                <div className="space-y-2">
                  <Label htmlFor="recurring-day">Day of Week</Label>
                  <Select
                    value={planForm.recurringDay}
                    onValueChange={(value) => setPlanForm({ ...planForm, recurringDay: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {planForm.recurring === "once" && (
                <div className="space-y-2">
                  <Label htmlFor="event-date">Event Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={planForm.date}
                    onChange={(e) => setPlanForm({ ...planForm, date: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={handleSavePlan}>
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

