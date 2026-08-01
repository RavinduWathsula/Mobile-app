import { useMemo, useState } from "react";
import {
  CalendarClock,
  Download,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

type GuestTier = "VIP" | "Frequent" | "Returning";

type GuestRecord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  nationality: string;
  preferredRoom: string;
  paymentReliability: "Excellent" | "Good" | "Needs follow-up";
  notes: string;
  tags: string[];
};

const GUESTS: GuestRecord[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john@example.com",
    phone: "+94 77 123 4567",
    visits: 5,
    lastVisit: "2026-02-15",
    totalSpent: 125000,
    nationality: "British",
    preferredRoom: "Single Room",
    paymentReliability: "Excellent",
    notes: "Usually books quiet upper-floor rooms and arrives late evening.",
    tags: ["Airport transfer", "Early breakfast"],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+94 77 234 5678",
    visits: 3,
    lastVisit: "2026-03-01",
    totalSpent: 85000,
    nationality: "Australian",
    preferredRoom: "Double Room",
    paymentReliability: "Good",
    notes: "Returns for weekend stays and often requests room-only pricing.",
    tags: ["Weekend guest", "Room only"],
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "+94 77 345 6789",
    visits: 8,
    lastVisit: "2026-02-28",
    totalSpent: 245000,
    nationality: "Sri Lankan",
    preferredRoom: "Triple Room",
    paymentReliability: "Excellent",
    notes: "High-value family bookings with frequent meal-plan upgrades.",
    tags: ["Family stay", "Meal upgrades"],
  },
  {
    id: 4,
    name: "Emma Davis",
    email: "emma@example.com",
    phone: "+94 71 456 7890",
    visits: 2,
    lastVisit: "2026-01-19",
    totalSpent: 48000,
    nationality: "German",
    preferredRoom: "Double Room",
    paymentReliability: "Needs follow-up",
    notes: "Had one delayed settlement at checkout, so confirm payment early.",
    tags: ["Late settlement", "Front desk reminder"],
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david@example.com",
    phone: "+94 70 111 2233",
    visits: 6,
    lastVisit: "2026-03-06",
    totalSpent: 198000,
    nationality: "Canadian",
    preferredRoom: "Honeymoon Suite",
    paymentReliability: "Excellent",
    notes: "Repeat premium guest who prefers direct booking and full-board plans.",
    tags: ["Premium guest", "Direct booking"],
  },
];

function formatCurrency(value: number) {
  return `LKR ${value.toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getGuestTier(guest: GuestRecord): GuestTier {
  if (guest.visits >= 6 || guest.totalSpent >= 180000) return "VIP";
  if (guest.visits >= 4) return "Frequent";
  return "Returning";
}

function getTierBadgeClass(tier: GuestTier) {
  if (tier === "VIP") return "bg-primary text-primary-foreground";
  if (tier === "Frequent") return "bg-amber-100 text-amber-700";
  return "bg-secondary text-secondary-foreground";
}

function getReliabilityClass(status: GuestRecord["paymentReliability"]) {
  if (status === "Excellent") return "text-emerald-600";
  if (status === "Good") return "text-amber-600";
  return "text-rose-600";
}

export function GuestHistory() {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | GuestTier>("all");
  const [selectedGuestId, setSelectedGuestId] = useState<number>(GUESTS[0]?.id ?? 0);

  const filteredGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return GUESTS.filter((guest) => {
      const matchesSegment = segment === "all" || getGuestTier(guest) === segment;
      const matchesQuery = !normalizedQuery || [
        guest.name,
        guest.email,
        guest.phone,
        guest.nationality,
        guest.preferredRoom,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesSegment && matchesQuery;
    });
  }, [query, segment]);

  const selectedGuest = useMemo(
    () => filteredGuests.find((guest) => guest.id === selectedGuestId) ?? filteredGuests[0] ?? null,
    [filteredGuests, selectedGuestId],
  );

  const totalGuests = filteredGuests.length;
  const vipGuests = filteredGuests.filter((guest) => getGuestTier(guest) === "VIP").length;
  const totalRevenue = filteredGuests.reduce((sum, guest) => sum + guest.totalSpent, 0);
  const averageVisits = filteredGuests.length
    ? (filteredGuests.reduce((sum, guest) => sum + guest.visits, 0) / filteredGuests.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <Badge variant="outline" className="w-fit border-primary/15 bg-primary/8 text-primary">
            Front office relationship view
          </Badge>
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground">Guest History</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Track repeat guests, understand visit patterns, and surface the details the front desk needs before check-in, upsell, or payment follow-up.
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export guest history
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Visible guest records</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{totalGuests}</div>
                <div className="mt-1 text-sm text-muted-foreground">Filtered by search and segment</div>
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
                <div className="text-sm text-muted-foreground">VIP guests</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{vipGuests}</div>
                <div className="mt-1 text-sm text-muted-foreground">High-value repeat relationships</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Tracked guest revenue</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{formatCurrency(totalRevenue)}</div>
                <div className="mt-1 text-sm text-muted-foreground">Lifetime spend in the current list</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Average visits</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">{averageVisits}</div>
                <div className="mt-1 text-sm text-muted-foreground">Repeat frequency across shown guests</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Guest records</CardTitle>
                <CardDescription>
                  Search by guest, contact details, nationality, or preferred room, then open a single record on the right for quick front-office review.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "VIP", "Frequent", "Returning"] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={segment === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSegment(option)}
                  >
                    {option === "all" ? "All guests" : option}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guests, email, phone, nationality, or preferred room"
                className="pl-10"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests.map((guest) => {
                    const tier = getGuestTier(guest);
                    const isSelected = selectedGuest?.id === guest.id;

                    return (
                      <TableRow
                        key={guest.id}
                        className={isSelected ? "bg-primary/5" : undefined}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{guest.name}</div>
                            <div className="text-xs text-muted-foreground">{guest.email}</div>
                            <div className="text-xs text-muted-foreground">{guest.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierBadgeClass(tier)}>{tier}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{guest.visits}</TableCell>
                        <TableCell>{formatDate(guest.lastVisit)}</TableCell>
                        <TableCell className="font-medium text-foreground">{formatCurrency(guest.totalSpent)}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${getReliabilityClass(guest.paymentReliability)}`}>
                            {guest.paymentReliability}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={isSelected ? "default" : "outline"} onClick={() => setSelectedGuestId(guest.id)}>
                            View profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {!filteredGuests.length && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                No guests match the current search or segment. Try clearing the filter to restore the full guest list.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>Guest profile</CardTitle>
            <CardDescription>
              Use this side panel to prepare the desk team before arrival, identify repeat value, and spot payment or service patterns.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {selectedGuest ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold tracking-[-0.02em] text-foreground">{selectedGuest.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{selectedGuest.nationality} / prefers {selectedGuest.preferredRoom}</div>
                    </div>
                    <Badge className={getTierBadgeClass(getGuestTier(selectedGuest))}>{getGuestTier(selectedGuest)}</Badge>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Visits</div>
                        <div className="mt-1 font-medium text-foreground">{selectedGuest.visits}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Last stay</div>
                        <div className="mt-1 font-medium text-foreground">{formatDate(selectedGuest.lastVisit)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lifetime spend</div>
                        <div className="mt-1 font-medium text-foreground">{formatCurrency(selectedGuest.totalSpent)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Payment</div>
                        <div className={`mt-1 font-medium ${getReliabilityClass(selectedGuest.paymentReliability)}`}>{selectedGuest.paymentReliability}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Contact details</div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="min-w-0 truncate text-foreground">{selectedGuest.email}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedGuest.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Front desk notes
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-3 text-sm leading-6 text-foreground">
                    {selectedGuest.notes}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Guest tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedGuest.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-border bg-background text-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                Select a guest from the table to review profile details here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
