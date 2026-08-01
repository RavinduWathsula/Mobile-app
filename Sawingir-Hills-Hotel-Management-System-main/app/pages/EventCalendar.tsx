import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Users,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface EventBooking {
  id: string;
  date: string;
  type: "wedding" | "corporate" | "birthday" | "engagement" | "reception";
  brideName?: string;
  groomName?: string;
  eventName: string;
  hall: string;
  guests: number;
  time: string;
  status: "confirmed" | "pending";
  payment: {
    total: number;
    paid: number;
  };
}

const eventBookings: EventBooking[] = [
  {
    id: "1",
    date: "2026-03-15",
    type: "wedding",
    brideName: "Sarah Johnson",
    groomName: "Michael Brown",
    eventName: "Sarah & Michael Wedding",
    hall: "Grand Ballroom",
    guests: 250,
    time: "18:00",
    status: "confirmed",
    payment: { total: 625000, paid: 625000 },
  },
  {
    id: "2",
    date: "2026-03-20",
    type: "corporate",
    eventName: "TechCorp Annual Gala",
    hall: "Crystal Hall",
    guests: 150,
    time: "19:00",
    status: "confirmed",
    payment: { total: 375000, paid: 200000 },
  },
  {
    id: "3",
    date: "2026-03-22",
    type: "engagement",
    brideName: "Emma Wilson",
    groomName: "David Martinez",
    eventName: "Emma & David Engagement",
    hall: "Garden Pavilion",
    guests: 100,
    time: "17:00",
    status: "pending",
    payment: { total: 250000, paid: 100000 },
  },
  {
    id: "4",
    date: "2026-03-25",
    type: "birthday",
    eventName: "Amanda's 50th Birthday",
    hall: "Royal Suite Hall",
    guests: 80,
    time: "18:30",
    status: "confirmed",
    payment: { total: 200000, paid: 200000 },
  },
  {
    id: "5",
    date: "2026-03-28",
    type: "wedding",
    brideName: "Priya Perera",
    groomName: "Kasun Silva",
    eventName: "Priya & Kasun Wedding",
    hall: "Grand Ballroom",
    guests: 300,
    time: "18:00",
    status: "confirmed",
    payment: { total: 750000, paid: 400000 },
  },
];

const eventTypeColors = {
  wedding: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  corporate: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  birthday: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  engagement: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  reception: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
};

export function EventCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [selectedEvent, setSelectedEvent] = useState<EventBooking | null>(null);
  const [filterHall, setFilterHall] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return eventBookings.filter((event) => {
      const matchesDate = event.date === dateStr;
      const matchesHall = filterHall === "all" || event.hall === filterHall;
      const matchesType = filterType === "all" || event.type === filterType;
      const matchesStatus = filterStatus === "all" || event.status === filterStatus;

      return matchesDate && matchesHall && matchesType && matchesStatus;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // Calculate statistics
  const totalEvents = eventBookings.length;
  const upcomingWeddings = eventBookings.filter((e) => e.type === "wedding").length;
  const pendingPayments = eventBookings.filter(
    (e) => e.payment.paid < e.payment.total
  ).length;

  const handleViewDetails = (event: EventBooking) => {
    if (event.type === "wedding" || event.type === "engagement") {
      navigate(`/wedding-booking?id=${event.id}&mode=view`);
    } else {
      navigate(`/event-reservation?id=${event.id}&mode=view`);
    }
  };

  const handleEditBooking = (event: EventBooking) => {
    if (event.type === "wedding" || event.type === "engagement") {
      navigate(`/wedding-booking?id=${event.id}&mode=edit`);
    } else {
      navigate(`/event-reservation?id=${event.id}&mode=edit`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F4E5C2] flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-[#2B0A57]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Booking Calendar</h1>
            <p className="text-gray-500 mt-1">
              View and manage all wedding and event reservations
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Weddings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingWeddings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Dates</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {daysInMonth - totalEvents}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hall</Label>
              <Select value={filterHall} onValueChange={setFilterHall}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Halls</SelectItem>
                  <SelectItem value="Grand Ballroom">Grand Ballroom</SelectItem>
                  <SelectItem value="Crystal Hall">Crystal Hall</SelectItem>
                  <SelectItem value="Garden Pavilion">Garden Pavilion</SelectItem>
                  <SelectItem value="Royal Suite Hall">Royal Suite Hall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legend */}
            <div className="pt-4 border-t space-y-2">
              <Label className="text-xs text-gray-500">Event Types</Label>
              <div className="space-y-2">
                {Object.entries(eventTypeColors).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{monthName}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const events = getEventsForDate(day);
                  const hasEvents = events.length > 0;

                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-2 hover:border-[#7C3AED] transition-colors ${
                        hasEvents ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-700 mb-1">{day}</div>
                      <div className="space-y-1">
                        {events.map((event) => {
                          const colors = eventTypeColors[event.type];
                          return (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`w-full text-left p-1.5 rounded text-xs ${colors.bg} ${colors.text} border ${colors.border} hover:shadow-md transition-shadow`}
                            >
                              <div className="font-medium truncate">{event.eventName}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{event.time}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Popup */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <Card
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge
                    className={`${eventTypeColors[selectedEvent.type].bg} ${
                      eventTypeColors[selectedEvent.type].text
                    } border ${eventTypeColors[selectedEvent.type].border} mb-2`}
                  >
                    {selectedEvent.type}
                  </Badge>
                  <CardTitle className="text-xl">{selectedEvent.eventName}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEvent.brideName && selectedEvent.groomName && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-gray-700">
                    {selectedEvent.brideName} & {selectedEvent.groomName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{selectedEvent.hall}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{selectedEvent.guests} Guests</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at {selectedEvent.time}
                </span>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold">
                    {selectedEvent.payment.total.toLocaleString()} LKR
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-semibold text-green-600">
                    {selectedEvent.payment.paid.toLocaleString()} LKR
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-semibold text-amber-600">
                    {(
                      selectedEvent.payment.total - selectedEvent.payment.paid
                    ).toLocaleString()}{" "}
                    LKR
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Badge
                  variant={selectedEvent.status === "confirmed" ? "default" : "outline"}
                  className={
                    selectedEvent.status === "confirmed"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-amber-100 text-amber-700 border-amber-300"
                  }
                >
                  {selectedEvent.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-[#2B0A57] hover:bg-[#3d1570]"
                  onClick={() => handleViewDetails(selectedEvent)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditBooking(selectedEvent)}
                >
                  Edit Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

