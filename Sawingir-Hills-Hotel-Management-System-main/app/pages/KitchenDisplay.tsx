import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BellRing, ChefHat, Clock3, Flame, Loader2, RefreshCw } from 'lucide-react';
import { NoOrders } from '../components/EmptyState';
import { toast } from 'sonner';

interface KitchenOrderItem {
  id: number;
  quantity: number;
  specialInstructions?: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  menuItem: {
    name: string;
    preparationTime: number;
  };
}

interface KitchenOrder {
  id: number;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'room_service';
  tableNumber?: string | null;
  notes?: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  createdAt: string;
  room?: { roomNumber: string } | null;
  guest?: { firstName: string; lastName: string } | null;
  items: KitchenOrderItem[];
}

type LaneKey = 'pending' | 'preparing' | 'ready';
type SourceFilter = 'all' | 'dine_in' | 'room_service';

const AUTO_REFRESH_MS = 20000;
const URGENT_AFTER_MINUTES = 15;

const laneMeta: Record<LaneKey, { title: string; description: string; badgeClass: string; panelClass: string }> = {
  pending: {
    title: 'New tickets',
    description: 'Start these first so the queue keeps moving.',
    badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
    panelClass: 'border-slate-200 bg-slate-50/80',
  },
  preparing: {
    title: 'On the line',
    description: 'Orders already being cooked right now.',
    badgeClass: 'border-amber-300 bg-amber-100 text-amber-800',
    panelClass: 'border-amber-200 bg-amber-50/70',
  },
  ready: {
    title: 'Ready pickup',
    description: 'Hold for service or room delivery.',
    badgeClass: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    panelClass: 'border-emerald-200 bg-emerald-50/70',
  },
};

function getElapsedMinutes(dateValue: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000));
}

function formatElapsed(dateValue: string) {
  const elapsedMinutes = getElapsedMinutes(dateValue);
  if (elapsedMinutes === 0) return 'Just now';
  if (elapsedMinutes === 1) return '1 min ago';
  return `${elapsedMinutes} mins ago`;
}

function formatLastUpdated(dateValue: Date | null) {
  if (!dateValue) {
    return 'Waiting for first sync';
  }

  return `Updated ${dateValue.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function getLocation(order: KitchenOrder) {
  if (order.orderType === 'room_service') {
    return order.room?.roomNumber ? `Room ${order.room.roomNumber}` : 'Room service';
  }

  if (order.tableNumber) {
    return `Table ${order.tableNumber}`;
  }

  return 'Restaurant floor';
}

function getGuestLabel(order: KitchenOrder) {
  if (!order.guest) {
    return order.orderType === 'room_service' ? 'In-house guest' : 'Walk-in guest';
  }

  return `${order.guest.firstName} ${order.guest.lastName}`.trim();
}

function getOrderStatusBadge(status: KitchenOrder['status']) {
  if (status === 'pending') return 'border-slate-300 bg-slate-100 text-slate-700';
  if (status === 'preparing') return 'border-amber-300 bg-amber-100 text-amber-800';
  return 'border-emerald-300 bg-emerald-100 text-emerald-800';
}

function getItemStatusBadge(status: KitchenOrderItem['status']) {
  if (status === 'pending') return 'border-slate-300 bg-slate-100 text-slate-700';
  if (status === 'preparing') return 'border-amber-300 bg-amber-100 text-amber-800';
  if (status === 'ready') return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  return 'border-slate-300 bg-slate-100 text-slate-600';
}

function getProgressValue(order: KitchenOrder) {
  const activeItems = order.items.filter((item) => item.status !== 'cancelled');
  if (activeItems.length === 0) {
    return 0;
  }

  const readyLikeCount = activeItems.filter((item) => item.status === 'ready' || item.status === 'served').length;
  return Math.round((readyLikeCount / activeItems.length) * 100);
}

function getSourceChipLabel(sourceFilter: SourceFilter) {
  if (sourceFilter === 'dine_in') return 'Table service';
  if (sourceFilter === 'room_service') return 'Room service';
  return 'All sources';
}

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [mobileLane, setMobileLane] = useState<LaneKey>('pending');

  async function loadOrders(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load kitchen orders');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadOrders();

    const timer = window.setInterval(() => {
      void loadOrders({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    if (sourceFilter === 'all') {
      return true;
    }

    return order.orderType === sourceFilter;
  }), [orders, sourceFilter]);

  const lanes = useMemo(() => ({
    pending: filteredOrders.filter((order) => order.status === 'pending'),
    preparing: filteredOrders.filter((order) => order.status === 'preparing'),
    ready: filteredOrders.filter((order) => order.status === 'ready'),
  }), [filteredOrders]);

  const urgentCount = useMemo(
    () => filteredOrders.filter((order) => getElapsedMinutes(order.createdAt) >= URGENT_AFTER_MINUTES && order.status !== 'ready').length,
    [filteredOrders],
  );

  const totalItemsInQueue = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    [filteredOrders],
  );

  const longestWaitMinutes = useMemo(
    () => filteredOrders.reduce((maxMinutes, order) => Math.max(maxMinutes, getElapsedMinutes(order.createdAt)), 0),
    [filteredOrders],
  );

  async function advanceItemStatus(orderId: number, item: KitchenOrderItem) {
    const nextStatus = item.status === 'pending' ? 'preparing' : item.status === 'preparing' ? 'ready' : null;
    if (!nextStatus) {
      return;
    }

    setUpdatingItemId(item.id);
    try {
      await api.updateRestaurantOrderItemStatus(orderId, item.id, nextStatus);
      toast.success(`Updated ${item.menuItem.name} to ${nextStatus}`);
      await loadOrders({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update kitchen item');
    } finally {
      setUpdatingItemId(null);
    }
  }

  function renderOrderCard(order: KitchenOrder) {
    const urgent = getElapsedMinutes(order.createdAt) >= URGENT_AFTER_MINUTES && order.status !== 'ready';
    const progressValue = getProgressValue(order);
    const activeItemCount = order.items.filter((item) => item.status !== 'cancelled').length;
    const readyLikeCount = order.items.filter((item) => item.status === 'ready' || item.status === 'served').length;

    return (
      <Card
        key={order.id}
        className={`overflow-hidden border shadow-sm ${urgent ? 'border-rose-300 shadow-rose-100' : 'border-slate-200'}`}
      >
        <div className={`h-1 w-full ${urgent ? 'bg-rose-500' : order.status === 'ready' ? 'bg-emerald-500' : 'bg-[#2B0A57]'}`} />
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl text-slate-900">{order.orderNumber}</CardTitle>
              <div className="mt-1 text-sm text-slate-600">{getLocation(order)} • {getGuestLabel(order)}</div>
            </div>
            <Badge className={getOrderStatusBadge(order.status)}>{order.status}</Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {formatElapsed(order.createdAt)}
            </Badge>
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} portions
            </Badge>
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              {order.orderType === 'room_service' ? 'Room service' : 'Table service'}
            </Badge>
            {urgent && (
              <Badge className="border-rose-300 bg-rose-100 text-rose-700">
                <Flame className="mr-1 h-3.5 w-3.5" />
                Urgent
              </Badge>
            )}
          </div>

          <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              <span>Ticket progress</span>
              <span>{readyLikeCount}/{activeItemCount} item states cleared</span>
            </div>
            <Progress value={progressValue} className="h-2.5 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-[#2B0A57]" />
          </div>

          {order.notes?.trim() && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Order note</div>
              {order.notes.trim()}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {order.items.map((item) => {
            const nextActionLabel = item.status === 'pending'
              ? 'Start preparing'
              : item.status === 'preparing'
                ? 'Mark ready'
                : null;

            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{item.quantity} x {item.menuItem.name}</div>
                    <div className="mt-1 text-sm text-slate-500">Target prep {item.menuItem.preparationTime} min</div>
                  </div>
                  <Badge className={getItemStatusBadge(item.status)}>{item.status}</Badge>
                </div>

                {item.specialInstructions?.trim() && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {item.specialInstructions.trim()}
                  </div>
                )}

                {nextActionLabel ? (
                  <Button
                    className="mt-3 w-full bg-[#2B0A57] hover:bg-[#3d1570]"
                    disabled={updatingItemId === item.id}
                    onClick={() => void advanceItemStatus(order.id, item)}
                  >
                    {updatingItemId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {nextActionLabel}
                  </Button>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {item.status === 'ready' ? 'Waiting for service pickup.' : 'No kitchen action needed on this item.'}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  function renderLane(lane: LaneKey, orderList: KitchenOrder[], scrollable: boolean) {
    const meta = laneMeta[lane];
    const content = orderList.length === 0 ? (
      <Card className="border-dashed border-slate-300 bg-white/80 shadow-none">
        <CardContent className="py-12 text-center text-sm text-slate-500">
          No {meta.title.toLowerCase()} right now.
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {orderList.map(renderOrderCard)}
      </div>
    );

    return (
      <section className="space-y-4">
        <div className={`rounded-3xl border p-4 shadow-sm ${meta.panelClass}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <ChefHat className="h-5 w-5 text-[#2B0A57]" />
                <h2 className="text-lg font-semibold">{meta.title}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-600">{meta.description}</p>
            </div>
            <Badge className={meta.badgeClass}>{orderList.length}</Badge>
          </div>
        </div>

        {scrollable ? (
          <ScrollArea className="h-[calc(100vh-23rem)] rounded-3xl pr-3">
            {content}
          </ScrollArea>
        ) : content}
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading kitchen display...
      </div>
    );
  }

  if (orders.length === 0) {
    return <NoOrders />;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#fff8eb] via-white to-[#f6efff] shadow-sm">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#2B0A57] shadow-sm">
              <BellRing className="h-3.5 w-3.5" />
              Live kitchen operations board
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Kitchen Display</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Built for cooks and pass staff. Watch urgency, move item states fast, and keep room-service and table tickets flowing from one live queue.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="font-medium text-slate-900">{formatLastUpdated(lastUpdatedAt)}</div>
              <div className="mt-1 text-xs text-slate-500">Auto-refresh every {AUTO_REFRESH_MS / 1000} seconds</div>
            </div>
            <Button
              variant="outline"
              className="min-h-11 bg-white/90"
              disabled={refreshing}
              onClick={() => void loadOrders({ silent: true })}
            >
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh queue
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-[#2B0A57]/10 p-3">
              <ChefHat className="h-5 w-5 text-[#2B0A57]" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Live tickets</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{filteredOrders.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-rose-100 p-3">
              <Flame className="h-5 w-5 text-rose-700" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Urgent now</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{urgentCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-amber-100 p-3">
              <Clock3 className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Longest wait</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{longestWaitMinutes} min</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-emerald-100 p-3">
              <BellRing className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Portions in queue</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{totalItemsInQueue}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900">Queue filters</div>
            <div className="mt-1 text-sm text-slate-500">Focus the kitchen board by order source without hiding the live status logic.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'dine_in', 'room_service'] as SourceFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={sourceFilter === filter ? 'default' : 'outline'}
                className={sourceFilter === filter ? 'bg-[#2B0A57] hover:bg-[#3d1570]' : ''}
                onClick={() => setSourceFilter(filter)}
              >
                {getSourceChipLabel(filter)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center text-sm text-slate-500">
            No kitchen tickets match the current source filter.
            <Button variant="outline" onClick={() => setSourceFilter('all')}>Show all live tickets</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="xl:hidden">
            <Tabs value={mobileLane} onValueChange={(value) => setMobileLane(value as LaneKey)}>
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="pending">Pending ({lanes.pending.length})</TabsTrigger>
                <TabsTrigger value="preparing">Preparing ({lanes.preparing.length})</TabsTrigger>
                <TabsTrigger value="ready">Ready ({lanes.ready.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">{renderLane('pending', lanes.pending, false)}</TabsContent>
              <TabsContent value="preparing" className="mt-4">{renderLane('preparing', lanes.preparing, false)}</TabsContent>
              <TabsContent value="ready" className="mt-4">{renderLane('ready', lanes.ready, false)}</TabsContent>
            </Tabs>
          </div>

          <div className="hidden gap-6 xl:grid xl:grid-cols-3">
            {renderLane('pending', lanes.pending, true)}
            {renderLane('preparing', lanes.preparing, true)}
            {renderLane('ready', lanes.ready, true)}
          </div>
        </>
      )}
    </div>
  );
}
