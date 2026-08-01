import { useEffect, useState } from 'react';
import {
  BedDouble,
  UserCheck,
  LogOut,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface DashboardStats {
  rooms: {
    total_rooms: number;
    occupied: number;
    available: number;
    dirty: number;
    maintenance: number;
  };
  occupancy_rate: number;
  today_arrivals: number;
  today_checkouts: number;
  revenue_today: number;
  pending_payments: number;
}

interface OccupancyPoint {
  date: string;
  occupied: number;
  occupancy: number;
}

interface RevenuePoint {
  period: string;
  revenue: number;
  transactions: number;
}

interface BookingSource {
  source: string;
  count: number;
  percentage: number;
}

const SOURCE_COLORS: Record<string, string> = {
  direct: '#7C3AED',
  ota: '#A855F7',
  walk_in: '#D946EF',
  corporate: '#5B21B6',
  phone: '#EC4899',
  website: '#C084FC',
};

function formatCurrency(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatShortCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString();
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [sources, setSources] = useState<BookingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = async () => {
    try {
      setError(null);
      setLoading(true);
      const [dashboardData, occupancyData, revenueData, sourceData] = await Promise.all([
        api.getDashboard(),
        api.getOccupancy(7),
        api.getRevenue(),
        api.getBookingSources(),
      ]);

      setStats(dashboardData);
      setOccupancy(occupancyData);
      setRevenue(revenueData);
      setSources(sourceData);
      setLastUpdated(new Date());
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const totalRooms = stats?.rooms.total_rooms || 0;
  const occupied = stats?.rooms.occupied || 0;
  const available = stats?.rooms.available || 0;
  const revenueToday = Number(stats?.revenue_today || 0);
  const occupancyRate = Number(stats?.occupancy_rate || 0);

  const metricCards = [
    {
      label: 'Total Rooms',
      value: totalRooms.toLocaleString(),
      note: 'Across the hotel inventory',
      accent: `${available} ready now`,
      icon: BedDouble,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Rooms Available',
      value: available.toLocaleString(),
      note: 'Ready for arrivals and walk-ins',
      accent: `${Math.max(totalRooms - available, 0)} occupied or blocked`,
      icon: Sparkles,
      iconClass: 'bg-emerald-500/12 text-emerald-600',
    },
    {
      label: 'Room Filled',
      value: occupied.toLocaleString(),
      note: 'Guests currently in-house',
      accent: `${occupancyRate}% occupancy`,
      icon: UserCheck,
      iconClass: 'bg-fuchsia-500/12 text-fuchsia-600',
    },
    {
      label: 'Revenue Today',
      value: formatShortCurrency(revenueToday),
      note: 'Room and stay revenue posted today',
      accent: `${formatCurrency(stats?.pending_payments || 0)} pending`,
      icon: DollarSign,
      iconClass: 'bg-amber-500/14 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/80 bg-card/92 p-6 shadow-[0_18px_50px_rgba(77,31,124,0.08)] backdrop-blur-sm lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Badge className="bg-primary/10 text-primary">Operations board</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-foreground lg:text-[2.1rem]">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground lg:text-base">
              {greeting}, {user?.fullName || 'team member'}. This workspace tracks room readiness, guest movement,
              and revenue signals in one purple-led control surface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-primary/10 bg-white/75 text-muted-foreground">7 day trend</Badge>
              <Badge variant="outline" className="border-primary/10 bg-white/75 text-muted-foreground">Live occupancy mix</Badge>
              <Badge variant="outline" className="border-primary/10 bg-white/75 text-muted-foreground">No blue accent palette</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            {lastUpdated && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-white/78 px-4 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <Button variant="outline" className="bg-white/78" onClick={() => void loadDashboard()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh board
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-[24px] border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 shadow-[0_1px_2px_rgba(127,29,29,0.05)] dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.label} className="overflow-hidden bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
                  <div className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] text-foreground">{card.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{card.note}</div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconClass}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 border-t border-border/70 pt-4 text-sm text-muted-foreground">{card.accent}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Occupancy Trend</CardTitle>
                <CardDescription>How room fill has moved across the last seven days.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/10 bg-primary/8 text-primary">
                <TrendingUp className="h-3 w-3" />
                Live pace
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {occupancy.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center rounded-[20px] bg-secondary/45 text-sm text-muted-foreground">
                No occupancy data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={occupancy}>
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(113, 82, 151, 0.14)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tickMargin={12} unit="%" />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Occupancy']} labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Area type="monotone" dataKey="occupancy" stroke="#7C3AED" strokeWidth={2.5} fill="url(#occupancyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue performance from room stays and guest activity.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/10 bg-primary/8 text-primary">Finance</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center rounded-[20px] bg-secondary/45 text-sm text-muted-foreground">
                No revenue data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(113, 82, 151, 0.14)" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tickMargin={12} tickFormatter={(value) => formatShortCurrency(value)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Bar dataKey="revenue" fill="#A855F7" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Booking Sources</CardTitle>
                <CardDescription>Where reservation demand is currently coming from.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/10 bg-primary/8 text-primary">Acquisition</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-[20px] bg-secondary/45 text-sm text-muted-foreground">
                No booking source data available yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={sources} dataKey="count" nameKey="source" innerRadius={58} outerRadius={88} paddingAngle={4}>
                      {sources.map((source) => (
                        <Cell key={source.source} fill={SOURCE_COLORS[source.source] || '#9F7AEA'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, _name, entry: any) => [`${value} bookings`, entry.payload.source]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {sources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between rounded-2xl bg-secondary/45 px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[source.source] || '#9F7AEA' }} />
                        <span className="capitalize text-foreground">{source.source.replace('_', ' ')}</span>
                      </div>
                      <span className="font-semibold text-muted-foreground">{source.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Room Status Overview</CardTitle>
                <CardDescription>Live operational room mix for the desk and housekeeping teams.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/10 bg-primary/8 text-primary">
                <Activity className="h-3 w-3" />
                Live status
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Available', value: stats?.rooms.available || 0, tone: 'bg-emerald-500/12 text-emerald-600', dot: 'bg-emerald-500' },
                { label: 'Occupied', value: stats?.rooms.occupied || 0, tone: 'bg-primary/10 text-primary', dot: 'bg-primary' },
                { label: 'Dirty', value: stats?.rooms.dirty || 0, tone: 'bg-rose-500/12 text-rose-600', dot: 'bg-rose-500' },
                { label: 'Maintenance', value: stats?.rooms.maintenance || 0, tone: 'bg-amber-500/12 text-amber-600', dot: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-border/70 bg-white/74 p-4 shadow-[0_1px_2px_rgba(56,22,92,0.04)]">
                  <div className={`inline-flex rounded-2xl px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.label}</div>
                  <div className="mt-5 text-[2rem] font-semibold tracking-[-0.03em] text-foreground">{item.value}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    Rooms in this state right now
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
