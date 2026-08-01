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
  Heart,
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
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";

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

interface WeddingBookingData {
  id: string;
  reservedBy: string;
  telephone: string;
  address: string;
  brideName: string;
  brideAddress: string;
  groomName: string;
  groomAddress: string;
  weddingDate: string;
  hall: string;
  menuPackage: string;
  guests: number;
  menuRate: number;
  foodOptions: FoodOption[];
  payments: Payment[];
  specialNotes: string;
  status: "confirmed" | "pending";
}

// Mock database of wedding bookings
const mockWeddingBookings: Record<string, WeddingBookingData> = {
  "1": {
    id: "1",
    reservedBy: "Mr. James Johnson",
    telephone: "+94 77 123 4567",
    address: "123 Main Street, Colombo 03",
    brideName: "Sarah Johnson",
    brideAddress: "456 Park Avenue, Colombo 05",
    groomName: "Michael Brown",
    groomAddress: "789 Lake Road, Kandy",
    weddingDate: "2026-03-15",
    hall: "grand-ballroom",
    menuPackage: "luxury-wedding",
    guests: 250,
    menuRate: 2500,
    foodOptions: [
      { id: "1", label: "Premium Bar Service", checked: true },
      { id: "2", label: "Professional Table Service", checked: true },
      { id: "3", label: "Soft Drinks & Beverages", checked: true },
      { id: "4", label: "Welcome Drinks", checked: true },
      { id: "5", label: "Live Cooking Stations", checked: true },
    ],
    payments: [
      {
        id: "p1",
        description: "Initial Deposit",
        date: "2026-01-15",
        method: "bank",
        billNo: "DEP-W001",
        amount: 200000,
      },
      {
        id: "p2",
        description: "Second Installment",
        date: "2026-02-15",
        method: "card",
        billNo: "DEP-W002",
        amount: 225000,
      },
      {
        id: "p3",
        description: "Final Payment",
        date: "2026-03-10",
        method: "cash",
        billNo: "DEP-W003",
        amount: 200000,
      },
    ],
    specialNotes: "Please arrange poruwa ceremony setup. Gold and white decoration theme. Professional photography coverage required.",
    status: "confirmed",
  },
  "3": {
    id: "3",
    reservedBy: "Mr. Robert Wilson",
    telephone: "+94 71 234 5678",
    address: "321 Beach Road, Galle",
    brideName: "Emma Wilson",
    brideAddress: "654 Hill Street, Kandy",
    groomName: "David Martinez",
    groomAddress: "987 Valley Road, Colombo 07",
    weddingDate: "2026-03-22",
    hall: "garden-pavilion",
    menuPackage: "premium-wedding",
    guests: 100,
    menuRate: 2500,
    foodOptions: [
      { id: "1", label: "Premium Bar Service", checked: true },
      { id: "2", label: "Professional Table Service", checked: true },
      { id: "3", label: "Soft Drinks & Beverages", checked: true },
      { id: "4", label: "Welcome Drinks", checked: false },
      { id: "5", label: "Live Cooking Stations", checked: false },
    ],
    payments: [
      {
        id: "p1",
        description: "Initial Deposit",
        date: "2026-02-01",
        method: "bank",
        billNo: "DEP-E003",
        amount: 100000,
      },
    ],
    specialNotes: "Garden setup with evening lights. Small intimate engagement ceremony.",
    status: "pending",
  },
  "5": {
    id: "5",
    reservedBy: "Mr. Sunil Perera",
    telephone: "+94 76 345 6789",
    address: "159 Temple Road, Kandy",
    brideName: "Priya Perera",
    brideAddress: "753 Mountain View, Kandy",
    groomName: "Kasun Silva",
    groomAddress: "951 Lake Side, Colombo 03",
    weddingDate: "2026-03-28",
    hall: "grand-ballroom",
    menuPackage: "royal-wedding",
    guests: 300,
    menuRate: 2500,
    foodOptions: [
      { id: "1", label: "Premium Bar Service", checked: true },
      { id: "2", label: "Professional Table Service", checked: true },
      { id: "3", label: "Soft Drinks & Beverages", checked: true },
      { id: "4", label: "Welcome Drinks", checked: true },
      { id: "5", label: "Live Cooking Stations", checked: true },
    ],
    payments: [
      {
        id: "p1",
        description: "Advance Payment",
        date: "2026-01-20",
        method: "bank",
        billNo: "DEP-W005",
        amount: 250000,
      },
      {
        id: "p2",
        description: "Second Payment",
        date: "2026-02-20",
        method: "card",
        billNo: "DEP-W005-2",
        amount: 150000,
      },
    ],
    specialNotes: "Traditional Kandyan wedding setup. Red and gold theme. Need extra stage decorations.",
    status: "confirmed",
  },
};

export function WeddingBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("id");
  const mode = searchParams.get("mode") || "create"; // view, edit, or create

  const [isEditMode, setIsEditMode] = useState(mode === "edit" || mode === "create");

  // Form state
  const [reservedBy, setReservedBy] = useState("");
  const [telephone, setTelephone] = useState("");
  const [address, setAddress] = useState("");
  const [brideName, setBrideName] = useState("");
  const [brideAddress, setBrideAddress] = useState("");
  const [groomName, setGroomName] = useState("");
  const [groomAddress, setGroomAddress] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [hall, setHall] = useState("grand-ballroom");
  const [menuPackage, setMenuPackage] = useState("premium-wedding");
  const [guests, setGuests] = useState(250);
  const [menuRate, setMenuRate] = useState(3500);
  const [specialNotes, setSpecialNotes] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([
    { id: "1", label: "Premium Bar Service", checked: true },
    { id: "2", label: "Professional Table Service", checked: true },
    { id: "3", label: "Soft Drinks & Beverages", checked: true },
    { id: "4", label: "Welcome Drinks", checked: false },
    { id: "5", label: "Live Cooking Stations", checked: false },
  ]);

  // Load booking data if ID is provided
  useEffect(() => {
    if (bookingId && mockWeddingBookings[bookingId]) {
      const booking = mockWeddingBookings[bookingId];
      setReservedBy(booking.reservedBy);
      setTelephone(booking.telephone);
      setAddress(booking.address);
      setBrideName(booking.brideName);
      setBrideAddress(booking.brideAddress);
      setGroomName(booking.groomName);
      setGroomAddress(booking.groomAddress);
      setWeddingDate(booking.weddingDate);
      setHall(booking.hall);
      setMenuPackage(booking.menuPackage);
      setGuests(booking.guests);
      setMenuRate(booking.menuRate);
      setSpecialNotes(booking.specialNotes);
      setPayments(booking.payments);
      setFoodOptions(booking.foodOptions);
    }
  }, [bookingId]);

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
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === "view"
                  ? "Wedding Reservation Details"
                  : mode === "edit"
                  ? "Edit Wedding Reservation"
                  : "New Wedding Reservation"}
              </h1>
              <p className="text-gray-500 mt-1">
                {bookingId ? `Booking ID: #${bookingId}` : "Create and manage wedding bookings with complete event details"}
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
            <Button className="gap-2 bg-[#2B0A57] hover:bg-[#3d1570]">
              <Save className="w-4 h-4" />
              Save Reservation
            </Button>
          )}
        </div>
      </div>

      {/* Section 1: Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7C3AED]" />
            Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reserved-by">Reserved By (Full Name)</Label>
              <Input
                id="reserved-by"
                placeholder="Enter full name"
                value={reservedBy}
                onChange={(e) => setReservedBy(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone Number</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="+94 XX XXX XXXX"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Wedding Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Wedding Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bride-name">Bride Name</Label>
              <Input
                id="bride-name"
                placeholder="Enter bride's full name"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bride-address">Bride Address</Label>
              <Input
                id="bride-address"
                placeholder="Enter bride's address"
                value={brideAddress}
                onChange={(e) => setBrideAddress(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-name">Bridegroom Name</Label>
              <Input
                id="groom-name"
                placeholder="Enter groom's full name"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-address">Bridegroom Address</Label>
              <Input
                id="groom-address"
                placeholder="Enter groom's address"
                value={groomAddress}
                onChange={(e) => setGroomAddress(e.target.value)}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#7C3AED]" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <Input
                id="wedding-date"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-package">Menu Package</Label>
              <Select value={menuPackage} onValueChange={setMenuPackage} disabled={!isEditMode}>
                <SelectTrigger id="menu-package">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard-wedding">Standard Wedding Package</SelectItem>
                  <SelectItem value="premium-wedding">Premium Wedding Package</SelectItem>
                  <SelectItem value="luxury-wedding">Luxury Wedding Package</SelectItem>
                  <SelectItem value="royal-wedding">Royal Wedding Package</SelectItem>
                  <SelectItem value="custom-wedding">Custom Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <Input
                id="guests"
                type="number"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                disabled={!isEditMode}
              />
            </div>
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
              <Label htmlFor="estimated-total">Estimated Total</Label>
              <Input
                id="estimated-total"
                value={`LKR ${totalMenuCost.toLocaleString()}`}
                disabled
                className="font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Food & Beverage Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#7C3AED]" />
            Food & Beverage Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foodOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
            Select additional food and beverage services configured for wedding events
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
              <div className="text-sm text-violet-600 mb-1 font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-violet-900">
                {totalMenuCost.toLocaleString()} <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-1 font-medium">Total Paid</div>
              <div className="text-2xl font-bold text-green-900">
                {totalPaid.toLocaleString()} <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-600 mb-1 font-medium">Balance Due</div>
              <div className="text-2xl font-bold text-amber-900">
                {balance.toLocaleString()} <span className="text-sm font-normal">LKR</span>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
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

      {/* Section 6: Special Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            Special Requirements & Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter special requests for decorations, stage setup, lighting, music, photography, special dietary requirements, or any other custom requests for the wedding..."
            rows={6}
            className="resize-none"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            disabled={!isEditMode}
          />
          <p className="text-sm text-gray-500 mt-2">
            Include all wedding-specific requirements such as stage decorations, bridal room setup, photography locations, special ceremonies, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
