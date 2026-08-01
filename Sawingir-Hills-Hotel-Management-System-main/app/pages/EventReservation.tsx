import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  FileText,
  Save,
  Printer,
  FileDown,
  Plus,
  Trash2,
  Briefcase,
  CheckSquare,
  Edit3,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { eventMenuById, eventMenuDefinitions, type EventMenuId } from "../lib/event-menus";

interface Payment {
  id: string;
  description: string;
  date: string;
  method: string;
  billNo: string;
  amount: number;
}

interface FoodOption {
  id: string;
  label: string;
  checked: boolean;
}

interface EventBookingData {
  id: string;
  organizerName: string;
  contactNumber: string;
  organizerAddress: string;
  email: string;
  company: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  hall: string;
  menuPackage: string;
  guests: number;
  menuRate: number;
  foodOptions: FoodOption[];
  payments: Payment[];
  specialNotes: string;
  status: "confirmed" | "pending";
}

// Mock database of event bookings
const mockEventBookings: Record<string, EventBookingData> = {
  "2": {
    id: "2",
    organizerName: "TechCorp Inc.",
    contactNumber: "+94 11 234 5678",
    organizerAddress: "45 Business Park, Colombo 02",
    email: "events@techcorp.com",
    company: "TechCorp Inc.",
    eventName: "TechCorp Annual Gala",
    eventType: "corporate",
    eventDate: "2026-03-20",
    startTime: "19:00",
    endTime: "23:00",
    hall: "crystal-hall",
    menuPackage: "gold-menu",
    guests: 150,
    menuRate: 5200,
    foodOptions: [
      { id: "1", label: "Coffee & Tea Service", checked: true },
      { id: "2", label: "Soft Drinks & Beverages", checked: true },
      { id: "3", label: "Lunch Buffet", checked: false },
      { id: "4", label: "Dinner Buffet", checked: true },
      { id: "5", label: "Snacks & Refreshments", checked: true },
      { id: "6", label: "Premium Bar Service", checked: true },
    ],
    payments: [
      {
        id: "p1",
        description: "Advance Payment",
        date: "2026-02-15",
        method: "bank",
        billNo: "DEP-E002",
        amount: 200000,
      },
    ],
    specialNotes: "AV equipment required. Stage setup for presentations. Podium and microphone needed.",
    status: "confirmed",
  },
  "4": {
    id: "4",
    organizerName: "Amanda Johnson",
    contactNumber: "+94 77 987 6543",
    organizerAddress: "78 Sunset Drive, Colombo 07",
    email: "amanda.j@email.com",
    company: "",
    eventName: "Amanda's 50th Birthday",
    eventType: "birthday",
    eventDate: "2026-03-25",
    startTime: "18:30",
    endTime: "22:00",
    hall: "royal-suite",
    menuPackage: "mangolian-menu",
    guests: 80,
    menuRate: 4500,
    foodOptions: [
      { id: "1", label: "Coffee & Tea Service", checked: true },
      { id: "2", label: "Soft Drinks & Beverages", checked: true },
      { id: "3", label: "Lunch Buffet", checked: false },
      { id: "4", label: "Dinner Buffet", checked: true },
      { id: "5", label: "Snacks & Refreshments", checked: true },
      { id: "6", label: "Premium Bar Service", checked: false },
    ],
    payments: [
      {
        id: "p1",
        description: "Full Payment",
        date: "2026-03-15",
        method: "card",
        billNo: "PAY-B004",
        amount: 200000,
      },
    ],
    specialNotes: "Birthday cake and decorations in gold theme. DJ and dance floor setup required.",
    status: "confirmed",
  },
};

export function EventReservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("id");
  const mode = searchParams.get("mode") || "create"; // view, edit, or create

  const [isEditMode, setIsEditMode] = useState(mode === "edit" || mode === "create");

  // Form state
  const [organizerName, setOrganizerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [organizerAddress, setOrganizerAddress] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("conference");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hall, setHall] = useState("crystal-hall");
  const [menuPackage, setMenuPackage] = useState<EventMenuId | "custom-package">("bronze-menu");
  const [guests, setGuests] = useState(100);
  const [menuRate, setMenuRate] = useState(eventMenuById["bronze-menu"].pricePerPerson);
  const [specialNotes, setSpecialNotes] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([
    { id: "1", label: "Coffee & Tea Service", checked: true },
    { id: "2", label: "Soft Drinks & Beverages", checked: true },
    { id: "3", label: "Lunch Buffet", checked: false },
    { id: "4", label: "Dinner Buffet", checked: false },
    { id: "5", label: "Snacks & Refreshments", checked: true },
    { id: "6", label: "Premium Bar Service", checked: false },
  ]);

  // Load booking data if ID is provided
  useEffect(() => {
    if (bookingId && mockEventBookings[bookingId]) {
      const booking = mockEventBookings[bookingId];
      setOrganizerName(booking.organizerName);
      setContactNumber(booking.contactNumber);
      setOrganizerAddress(booking.organizerAddress);
      setEmail(booking.email);
      setCompany(booking.company);
      setEventName(booking.eventName);
      setEventType(booking.eventType);
      setEventDate(booking.eventDate);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setHall(booking.hall);
      setMenuPackage(booking.menuPackage as EventMenuId | "custom-package");
      setGuests(booking.guests);
      setMenuRate(booking.menuRate);
      setSpecialNotes(booking.specialNotes);
      setPayments(booking.payments);
      setFoodOptions(booking.foodOptions);
    }
  }, [bookingId]);

  // Update menu rate when package changes
  useEffect(() => {
    if (menuPackage !== "custom-package") {
      setMenuRate(eventMenuById[menuPackage].pricePerPerson);
    }
  }, [menuPackage]);

  const selectedMenuDefinition =
    menuPackage === "custom-package" ? null : eventMenuById[menuPackage];
  const guestLimitMessage =
    selectedMenuDefinition?.minimumGuests && guests < selectedMenuDefinition.minimumGuests
      ? `This package requires at least ${selectedMenuDefinition.minimumGuests} guests.`
      : selectedMenuDefinition?.maximumGuests && guests > selectedMenuDefinition.maximumGuests
        ? `This package supports a maximum of ${selectedMenuDefinition.maximumGuests} guests.`
        : null;
  const totalMenuCost = guests * menuRate;
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = totalMenuCost - totalPaid;

  const addPayment = () => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      description: "Payment",
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      billNo: "",
      amount: 0,
    };
    setPayments([...payments, newPayment]);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const updatePayment = (id: string, field: keyof Payment, value: string | number) => {
    setPayments(
      payments.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const toggleFoodOption = (id: string) => {
    setFoodOptions(
      foodOptions.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {bookingId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/event-calendar")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Calendar
              </Button>
            )}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2B0A57] to-[#7C3AED] flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === "view"
                  ? "Event Reservation Details"
                  : mode === "edit"
                  ? "Edit Event Reservation"
                  : "New Event Reservation"}
              </h1>
              <p className="text-gray-500 mt-1">
                {bookingId ? `Booking ID: #${bookingId}` : "Create and manage bookings for corporate events, conferences, birthdays, and meetings"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode === "view" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsEditMode(true)}
            >
              <Edit3 className="w-4 h-4" />
              Edit Booking
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <FileDown className="w-4 h-4" />
            Generate PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {isEditMode && (
            <Button
              className="gap-2 bg-[#2B0A57] hover:bg-[#3d1570]"
              disabled={Boolean(guestLimitMessage)}
            >
              <Save className="w-4 h-4" />
              Save Reservation
            </Button>
          )}
        </div>
      </div>

      {/* Section 1: Organizer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7C3AED]" />
            Organizer Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizer-name">Organizer Name</Label>
              <Input
                id="organizer-name"
                placeholder="Enter full name or company name"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input
                id="contact-number"
                type="tel"
                placeholder="+94 XX XXX XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="organizer-address">Address</Label>
              <Input
                id="organizer-address"
                placeholder="Enter organizer's address"
                value={organizerAddress}
                onChange={(e) => setOrganizerAddress(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization (Optional)</Label>
              <Input
                id="company"
                placeholder="Enter company or organization name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#7C3AED]" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                placeholder="Enter event name or title"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType} disabled={!isEditMode}>
                <SelectTrigger id="event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="meeting">Business Meeting</SelectItem>
                  <SelectItem value="seminar">Seminar/Workshop</SelectItem>
                  <SelectItem value="birthday">Birthday Party</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="reunion">Reunion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hall">Hall Selection</Label>
              <Select value={hall} onValueChange={setHall} disabled={!isEditMode}>
                <SelectTrigger id="hall">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grand-ballroom">Grand Ballroom</SelectItem>
                  <SelectItem value="crystal-hall">Crystal Hall</SelectItem>
                  <SelectItem value="garden-pavilion">Garden Pavilion</SelectItem>
                  <SelectItem value="royal-suite">Royal Suite Hall</SelectItem>
                  <SelectItem value="emerald-hall">Emerald Hall</SelectItem>
                  <SelectItem value="boardroom">Executive Boardroom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <Input
                id="guests"
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-package">Menu Package</Label>
              <Select
                value={menuPackage}
                onValueChange={(value) => setMenuPackage(value as EventMenuId | "custom-package")}
                disabled={!isEditMode}
              >
                <SelectTrigger id="menu-package">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventMenuDefinitions.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name} - LKR {menu.pricePerPerson.toLocaleString()} per pax
                    </SelectItem>
                  ))}
                  <SelectItem value="custom-package">Custom Package</SelectItem>
                </SelectContent>
              </Select>
              {selectedMenuDefinition && (
                <p className={`text-xs ${guestLimitMessage ? "text-red-600" : "text-gray-500"}`}>
                  {guestLimitMessage ??
                    (selectedMenuDefinition.maximumGuests
                      ? `${selectedMenuDefinition.minimumGuests}-${selectedMenuDefinition.maximumGuests} guests allowed`
                      : `Minimum ${selectedMenuDefinition.minimumGuests} guests`)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#7C3AED]" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-rate">Menu Rate (LKR per person)</Label>
              <Input
                id="menu-rate"
                type="number"
                value={menuRate}
                onChange={(e) => setMenuRate(parseInt(e.target.value) || 0)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-guests">Total Guests</Label>
              <Input id="total-guests" type="number" value={guests} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated-total">Estimated Total</Label>
              <Input
                id="estimated-total"
                value={`LKR ${totalMenuCost.toLocaleString()}`}
                disabled
                className="font-semibold"
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="mt-6 p-4 bg-gradient-to-br from-[#2B0A57]/5 to-[#7C3AED]/5 rounded-lg border border-[#2B0A57]/10">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Menu Rate × Guests</span>
                <span className="text-gray-500">
                  {menuRate.toLocaleString()} × {guests}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold text-gray-900">Total Cost</span>
                <span className="text-2xl font-bold text-[#2B0A57]">
                  {totalMenuCost.toLocaleString()} <span className="text-sm">LKR</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Food Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#7C3AED]" />
            Food & Beverage Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={() => toggleFoodOption(option.id)}
                  disabled={!isEditMode}
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Select food and beverage options configured in the Back Office for event bookings
          </p>
        </CardContent>
      </Card>

      {/* Section 5: Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#7C3AED]" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-100 rounded-lg border border-violet-200">
              <div className="text-sm text-violet-600 mb-1 font-medium">
                Total Amount
              </div>
              <div className="text-2xl font-bold text-violet-900">
                {totalMenuCost.toLocaleString()}{" "}
                <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-1 font-medium">
                Total Paid
              </div>
              <div className="text-2xl font-bold text-green-900">
                {totalPaid.toLocaleString()}{" "}
                <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-600 mb-1 font-medium">
                Balance Due
              </div>
              <div className="text-2xl font-bold text-amber-900">
                {balance.toLocaleString()}{" "}
                <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Payment History
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bill No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount (LKR)
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Input
                            value={payment.description}
                            onChange={(e) =>
                              updatePayment(payment.id, "description", e.target.value)
                            }
                            className="h-9"
                            placeholder="Description"
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="date"
                            value={payment.date}
                            onChange={(e) =>
                              updatePayment(payment.id, "date", e.target.value)
                            }
                            className="h-9"
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={payment.method}
                            onValueChange={(value) =>
                              updatePayment(payment.id, "method", value)
                            }
                            disabled={!isEditMode}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={payment.billNo}
                            onChange={(e) =>
                              updatePayment(payment.id, "billNo", e.target.value)
                            }
                            className="h-9"
                            placeholder="Bill number"
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePayment(
                                payment.id,
                                "amount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-9"
                            placeholder="Amount"
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {isEditMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePayment(payment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {isEditMode && (
              <Button
                variant="outline"
                onClick={addPayment}
                className="w-full gap-2 border-dashed mt-3"
              >
                <Plus className="w-4 h-4" />
                Add Payment Entry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Special Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            Special Requirements & Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter special requirements such as AV equipment, seating arrangements, presentation setup, dietary restrictions, accessibility needs, or any other custom requests..."
            rows={6}
            className="resize-none"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            disabled={!isEditMode}
          />
          <p className="text-sm text-gray-500 mt-2">
            Include details about technical equipment, room setup preferences, catering
            requirements, or any special accommodations needed for the event.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

