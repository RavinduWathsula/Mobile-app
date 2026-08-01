import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  ChevronDown,
  ChevronUp,
  ChefHat,
  ClipboardList,
  CreditCard,
  Hotel,
  Loader2,
  PauseCircle,
  Play,
  Printer,
  Search,
  ShieldAlert,
  ShoppingCart,
  TableProperties,
  UserRound,
  X,
} from 'lucide-react';
import { NoOrders } from '../components/EmptyState';
import { toast } from 'sonner';

const HELD_PREFIX = '[HELD]';
const ORDER_META_PREFIX = '[POS_META]';

type OrderSource = 'table' | 'room';
type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online' | 'room_charge';

interface RestaurantCategory {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
}

interface RestaurantTable {
  id: number;
  code: string;
  name: string;
  area?: string | null;
  capacity: number;
  status: 'available' | 'occupied' | 'held' | 'payment_due';
  openOrderCount: number;
  currentOrderId?: number | null;
  currentOrderNumber?: string | null;
  currentWaiter?: string | null;
}

interface RestaurantMenuItem {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  price: number | string;
  preparationTime: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  category?: { name: string };
}

interface BookingOption {
  id: number;
  bookingRef: string;
  roomId?: number | null;
  guestId?: number | null;
  room?: { roomNumber: string } | null;
  guest?: { firstName: string; lastName: string } | null;
}

interface OrderListItem {
  id: number;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'room_service';
  tableNumber?: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  totalAmount: number | string;
  subtotal?: number | string;
  taxAmount?: number | string;
  serviceCharge?: number | string;
  discount: number | string;
  paymentMethod?: string | null;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  notes?: string | null;
  createdAt: string;
  creator?: { id: number; fullName?: string | null; username?: string | null } | null;
  room?: { roomNumber: string } | null;
  guest?: { firstName: string; lastName: string } | null;
  booking?: { id: number; bookingRef: string } | null;
  invoices?: Array<{
    id: number;
    payments?: Array<{ id: number; amount: number | string; paymentMethod: PaymentMethod }>;
  }>;
  items: Array<{
    id: number;
    quantity: number;
    status: string;
    specialInstructions?: string | null;
    unitPrice?: number | string;
    totalPrice?: number | string;
    menuItem: { name: string };
  }>;
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  specialInstructions?: string;
}

interface PaymentLine {
  id: number;
  paymentMethod: Exclude<PaymentMethod, 'room_charge'>;
  amount: string;
}

interface RestaurantPosSettings {
  specialInstructionsEnabled: boolean;
  modifierPresets: string[];
}

const defaultRestaurantPosSettings: RestaurantPosSettings = {
  specialInstructionsEnabled: true,
  modifierPresets: ['No onion', 'Less spicy', 'Extra spicy', 'No ice', 'Urgent'],
};

const paymentMethodOptions: Array<{ value: Exclude<PaymentMethod, 'room_charge'>; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online', label: 'Online' },
];

function formatMoney(value: number | string) {
  return `${Math.round(Number(value || 0)).toLocaleString()} LKR`;
}

function isHeldOrder(order: Pick<OrderListItem, 'notes'>) {
  return Boolean(order.notes?.trim().startsWith(HELD_PREFIX));
}

interface ParsedOrderNotes {
  customerName: string;
  customerPhone: string;
  serviceNotes: string;
}

function parseOrderNotes(notes?: string | null): ParsedOrderNotes {
  const cleanedNotes = notes
    ? notes.replace(`${HELD_PREFIX}\n`, '').replace(HELD_PREFIX, '').trim()
    : '';

  if (!cleanedNotes) {
    return { customerName: '', customerPhone: '', serviceNotes: '' };
  }

  let customerName = '';
  let customerPhone = '';
  const serviceLines: string[] = [];

  for (const line of cleanedNotes.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith(ORDER_META_PREFIX)) {
      const payload = trimmed.slice(ORDER_META_PREFIX.length).trim();
      const separatorIndex = payload.indexOf('=');
      if (separatorIndex > 0) {
        const key = payload.slice(0, separatorIndex).trim();
        const value = payload.slice(separatorIndex + 1).trim();

        if (key === 'customer_name') {
          customerName = value;
          continue;
        }

        if (key === 'customer_phone') {
          customerPhone = value;
          continue;
        }
      }
    }

    serviceLines.push(line);
  }

  return {
    customerName,
    customerPhone,
    serviceNotes: serviceLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
  };
}

function buildOrderNotes(customerName: string, customerPhone: string, serviceNotes: string) {
  const noteLines: string[] = [];

  if (customerName.trim()) {
    noteLines.push(`${ORDER_META_PREFIX} customer_name=${customerName.trim()}`);
  }

  if (customerPhone.trim()) {
    noteLines.push(`${ORDER_META_PREFIX} customer_phone=${customerPhone.trim()}`);
  }

  const cleanServiceNotes = serviceNotes.trim();
  if (cleanServiceNotes) {
    noteLines.push('', cleanServiceNotes);
  }

  return noteLines.join('\n').trim();
}

function visibleNotes(notes?: string | null) {
  return parseOrderNotes(notes).serviceNotes;
}

function getGuestName(order: { guest?: { firstName: string; lastName: string } | null; notes?: string | null }) {
  if (order.guest) {
    return `${order.guest.firstName} ${order.guest.lastName}`.trim();
  }

  return parseOrderNotes(order.notes).customerName || 'Walk-in guest';
}

function getGuestContact(notes?: string | null) {
  return parseOrderNotes(notes).customerPhone;
}

function getLocationLabel(order: Pick<OrderListItem, 'orderType' | 'tableNumber' | 'room'>) {
  if (order.orderType === 'room_service') {
    return order.room?.roomNumber ? `Room ${order.room.roomNumber}` : 'Room service';
  }

  if (order.tableNumber) {
    return `Table ${order.tableNumber}`;
  }

  return 'Restaurant';
}

function getStatusBadge(status: OrderListItem['status']) {
  const styles: Record<OrderListItem['status'], string> = {
    pending: 'bg-slate-100 text-slate-700 border-slate-300',
    preparing: 'bg-amber-100 text-amber-700 border-amber-300',
    ready: 'bg-green-100 text-green-700 border-green-300',
    served: 'bg-violet-100 text-violet-700 border-violet-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-300',
  };

  return <Badge className={styles[status]}>{status.replace('_', ' ')}</Badge>;
}

function getPaidAmount(order: OrderListItem) {
  return order.invoices?.[0]?.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0;
}

function getOutstandingAmount(order: OrderListItem) {
  return Math.max(Number(order.totalAmount) - getPaidAmount(order), 0);
}

function getPaymentLabel(order: OrderListItem) {
  const payments = order.invoices?.[0]?.payments ?? [];
  if (payments.length > 1) {
    return `Split (${payments.length} payments)`;
  }

  if (payments.length === 1) {
    return payments[0].paymentMethod;
  }

  return order.paymentMethod || 'Not captured yet';
}

function getOrderSubtotal(order: OrderListItem) {
  return Number(order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0));
}

function getOrderDiscount(order: OrderListItem) {
  return Number(order.discount || 0);
}

function getOrderTaxAmount(order: OrderListItem) {
  return Number(order.taxAmount || 0);
}

function getOrderServiceCharge(order: OrderListItem) {
  return Number(order.serviceCharge || 0);
}

function getWaiterName(order: OrderListItem) {
  return order.creator?.fullName || order.creator?.username || 'Unknown waiter';
}

function escapePrintText(value?: string | number | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrintDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function canPrintKitchen(order: OrderListItem) {
  return !isHeldOrder(order) && order.status !== 'completed' && order.status !== 'cancelled';
}

function canPrintReceipt(order: OrderListItem) {
  return order.status === 'completed';
}

function canModifyOrder(order: OrderListItem) {
  return order.status !== 'completed' && order.status !== 'cancelled';
}

function getTableStatusClasses(status: RestaurantTable['status']) {
  const styles: Record<RestaurantTable['status'], string> = {
    available: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    occupied: 'border-amber-200 bg-amber-50 text-amber-700',
    held: 'border-violet-200 bg-violet-50 text-violet-700',
    payment_due: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return styles[status];
}
export function RestaurantPOS() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [payingOrder, setPayingOrder] = useState(false);
  const [activeView, setActiveView] = useState<'new' | 'orders'>('new');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [orderSource, setOrderSource] = useState<OrderSource>('table');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [myOrdersOnly, setMyOrdersOnly] = useState(false);
  const [showHeldOnly, setShowHeldOnly] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<OrderListItem | null>(null);
  const [expandedOrderActionsId, setExpandedOrderActionsId] = useState<number | null>(null);
  const [useRoomCharge, setUseRoomCharge] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ id: 1, paymentMethod: 'cash', amount: '' }]);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantPosSettings>(defaultRestaurantPosSettings);
  const orderSummaryRef = useRef<HTMLDivElement | null>(null);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => String(booking.id) === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );
  const selectedTable = useMemo(
    () => tables.find((table) => table.code === tableNumber) || null,
    [tableNumber, tables],
  );

  const draftGuestName = useMemo(() => {
    if (customerName.trim()) {
      return customerName.trim();
    }

    if (selectedBooking?.guest) {
      return `${selectedBooking.guest.firstName} ${selectedBooking.guest.lastName}`.trim();
    }

    return 'Walk-in guest';
  }, [customerName, selectedBooking]);

  const draftGuestContact = useMemo(() => customerPhone.trim(), [customerPhone]);

  const editingOrder = useMemo(
    () => orders.find((order) => order.id === editingOrderId) || null,
    [editingOrderId, orders],
  );

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = menuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || String(item.categoryId) === activeCategory;
      const matchesSearch = normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.description?.toLowerCase().includes(normalizedSearch)
        || item.category?.name?.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menuItems, menuSearch]);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (myOrdersOnly && order.creator?.id !== user?.id) {
      return false;
    }

    if (showHeldOnly && !isHeldOrder(order)) {
      return false;
    }

    return true;
  }), [myOrdersOnly, orders, showHeldOnly, user?.id]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const openOrders = useMemo(
    () => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)),
    [orders],
  );

  const heldOrders = useMemo(
    () => openOrders.filter((order) => isHeldOrder(order)),
    [openOrders],
  );
  const availableTables = useMemo(
    () => tables.filter((table) => table.status === 'available').length,
    [tables],
  );

  const activeKitchenOrders = useMemo(
    () => openOrders.filter((order) => ['pending', 'preparing', 'ready'].includes(order.status)).length,
    [openOrders],
  );

  async function loadData() {
    setLoading(true);
    try {
      const [tableData, categoryData, menuData, orderData, bookingData, settingsData] = await Promise.all([
        api.getRestaurantTables(),
        api.getRestaurantCategories(),
        api.getRestaurantMenu({ available: true }),
        api.getRestaurantOrders({ limit: 100 }),
        api.getBookings({ status: 'checked_in', limit: 50 }),
        api.getRestaurantSettings(),
      ]);

      setTables(tableData);
      setCategories(categoryData);
      setMenuItems(menuData);
      setOrders(orderData.data ?? []);
      setBookings(bookingData.data ?? []);
      setRestaurantSettings({
        specialInstructionsEnabled: settingsData.specialInstructionsEnabled !== false,
        modifierPresets: settingsData.modifierPresets ?? defaultRestaurantPosSettings.modifierPresets,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load restaurant POS');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function addToCart(item: RestaurantMenuItem) {
    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem.menuItemId === item.id);
      if (existing) {
        return currentCart.map((cartItem) => (
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      }

      return [
        ...currentCart,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      ];
    });
  }

  function updateCartQuantity(menuItemId: number, delta: number) {
    setCart((currentCart) => currentCart
      .map((item) => item.menuItemId === menuItemId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  }

  function updateItemInstructions(menuItemId: number, specialInstructions: string) {
    setCart((currentCart) => currentCart.map((item) => (
      item.menuItemId === menuItemId ? { ...item, specialInstructions } : item
    )));
  }

  function applyModifierPreset(menuItemId: number, preset: string) {
    setCart((currentCart) => currentCart.map((item) => {
      if (item.menuItemId !== menuItemId) {
        return item;
      }

      const existing = item.specialInstructions?.trim();
      const nextValue = existing
        ? existing.toLowerCase().includes(preset.toLowerCase())
          ? existing
          : `${existing}, ${preset}`
        : preset;

      return { ...item, specialInstructions: nextValue };
    }));
  }

  function resetComposer() {
    setCart([]);
    setNotes('');
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setSelectedBookingId('');
    setOrderSource('table');
    setMenuSearch('');
    setActiveCategory('all');
    setEditingOrderId(null);
  }

  function scrollToSummary() {
    orderSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startAppend(order: OrderListItem) {
    const parsedNotes = parseOrderNotes(order.notes);
    setEditingOrderId(order.id);
    setNotes(parsedNotes.serviceNotes);
    setCustomerName(parsedNotes.customerName);
    setCustomerPhone(parsedNotes.customerPhone);
    setOrderSource(order.orderType === 'room_service' ? 'room' : 'table');
    setTableNumber(order.tableNumber || '');
    setSelectedBookingId(order.booking?.id ? String(order.booking.id) : '');
    setActiveView('new');
    setCart([]);
    scrollToSummary();
  }

  async function submitOrder(mode: 'hold' | 'send') {
    if (cart.length === 0) {
      toast.error('Add at least one menu item before continuing');
      return;
    }

    if (orderSource === 'table' && !tableNumber.trim()) {
      toast.error('Select a table first');
      return;
    }

    if (orderSource === 'room' && !selectedBooking) {
      toast.error('Choose a checked-in booking for room service');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        orderType: orderSource === 'table' ? 'dine_in' : 'room_service',
        tableNumber: orderSource === 'table' ? tableNumber.trim() : undefined,
        bookingId: selectedBooking?.id,
        roomId: selectedBooking?.roomId ?? undefined,
        guestId: selectedBooking?.guestId ?? undefined,
        notes: buildOrderNotes(customerName, customerPhone, notes) || undefined,
        submitToKitchen: mode === 'send',
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions?.trim() || undefined,
        })),
      };

      const order = editingOrderId
        ? await api.addRestaurantOrderItems(editingOrderId, payload)
        : await api.createRestaurantOrder(payload);

      toast.success(mode === 'hold' ? `Saved ${order.orderNumber} as a held tab` : `${order.orderNumber} sent to kitchen`);
      resetComposer();
      setActiveView('orders');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save restaurant order');
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function releaseHeldOrder(order: OrderListItem) {
    try {
      await api.releaseRestaurantOrder(order.id);
      toast.success(`${order.orderNumber} released to the kitchen`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to release held order');
    }
  }

  async function markServed(order: OrderListItem) {
    try {
      await api.updateRestaurantOrderStatus(order.id, 'served');
      toast.success(`${order.orderNumber} marked as served`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    }
  }

  function openPaymentDialog(order: OrderListItem) {
    const outstanding = getOutstandingAmount(order);
    setPaymentTarget(order);
    setUseRoomCharge(order.orderType === 'room_service' && outstanding > 0);
    setDiscount(String(Number(order.discount || 0)));
    setPaymentLines([{ id: Date.now(), paymentMethod: 'cash', amount: outstanding ? String(Math.round(outstanding)) : '' }]);
    setPaymentDialogOpen(true);
  }

  function updatePaymentLine(id: number, field: 'paymentMethod' | 'amount', value: string) {
    setPaymentLines((current) => current.map((line) => (
      line.id === id ? { ...line, [field]: value } : line
    )));
  }

  function addPaymentLine() {
    setPaymentLines((current) => [...current, { id: Date.now(), paymentMethod: 'cash', amount: '' }]);
  }

  function removePaymentLine(id: number) {
    setPaymentLines((current) => current.length === 1 ? current : current.filter((line) => line.id !== id));
  }

  async function submitPayment() {
    if (!paymentTarget) {
      return;
    }

    setPayingOrder(true);
    try {
      if (useRoomCharge) {
        await api.updateRestaurantPayment(paymentTarget.id, {
          paymentMethod: 'room_charge',
          discount: Number(discount || 0),
        });
      } else {
        const payments = paymentLines
          .filter((line) => Number(line.amount) > 0)
          .map((line) => ({ paymentMethod: line.paymentMethod, amount: Number(line.amount) }));

        if (payments.length === 0) {
          toast.error('Add at least one payment amount');
          return;
        }

        await api.updateRestaurantPayment(paymentTarget.id, {
          discount: Number(discount || 0),
          payments,
        });
      }

      toast.success(`${paymentTarget.orderNumber} payment updated`);
      setPaymentDialogOpen(false);
      setPaymentTarget(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
    } finally {
      setPayingOrder(false);
    }
  }

  async function requestVoid(order: OrderListItem) {
    const reason = window.prompt(`Void reason for ${order.orderNumber}`)?.trim();
    if (!reason) {
      return;
    }

    try {
      await api.requestRestaurantVoid(order.id, reason);
      toast.success(`Void request logged for ${order.orderNumber}`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request void');
    }
  }

  async function approveVoid(order: OrderListItem) {
    const reason = window.prompt(`Approval note for cancelling ${order.orderNumber}`)?.trim();
    if (!reason) {
      return;
    }

    try {
      await api.approveRestaurantVoid(order.id, reason);
      toast.success(`${order.orderNumber} cancelled`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve void');
    }
  }

  async function refundOrder(order: OrderListItem) {
    const amount = window.prompt(`Refund amount for ${order.orderNumber}`);
    const reason = window.prompt(`Refund reason for ${order.orderNumber}`)?.trim();
    if (!amount || !reason) {
      return;
    }

    try {
      await api.refundRestaurantOrder(order.id, { amount: Number(amount), reason });
      toast.success(`Refund note recorded for ${order.orderNumber}`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record refund');
    }
  }

    function printOrder(order: OrderListItem, mode: 'receipt' | 'kitchen') {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      toast.error('Allow popups to print this order');
      return;
    }

    const notesText = visibleNotes(order.notes);
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const issuedAt = formatPrintDate(order.createdAt);
    const paidAmount = getPaidAmount(order);
    const outstandingAmount = getOutstandingAmount(order);
    const subtotalAmount = getOrderSubtotal(order);
    const discountAmount = getOrderDiscount(order);
    const taxAmount = getOrderTaxAmount(order);
    const serviceChargeAmount = getOrderServiceCharge(order);
    const title = mode === 'receipt' ? 'Guest receipt' : 'Kitchen order ticket';
    const documentChip = mode === 'receipt' ? 'Guest copy' : 'Kitchen copy';
    const guestContact = getGuestContact(order.notes);
    const itemRows = order.items.map((item) => {
      const itemLineTotal = Number(item.totalPrice ?? Number(item.unitPrice || 0) * item.quantity);
      const itemNotes = item.specialInstructions?.trim();

      return mode === 'receipt'
        ? `
      <tr>
        <td class="qty-cell">${escapePrintText(item.quantity)}</td>
        <td class="item-cell">
          <div class="item-name">${escapePrintText(item.menuItem.name)}</div>
          ${itemNotes ? `<div class="item-note">${escapePrintText(itemNotes)}</div>` : ''}
        </td>
        <td class="money-cell">${escapePrintText(formatMoney(item.unitPrice || 0))}</td>
        <td class="money-cell">${escapePrintText(formatMoney(itemLineTotal))}</td>
      </tr>
    `
        : `
      <tr>
        <td class="qty-cell">${escapePrintText(item.quantity)}</td>
        <td class="item-cell">
          <div class="item-name">${escapePrintText(item.menuItem.name)}</div>
          ${itemNotes ? `<div class="item-note">Special: ${escapePrintText(itemNotes)}</div>` : ''}
        </td>
        <td class="status-cell"><span class="status-pill">${escapePrintText(item.status)}</span></td>
      </tr>
    `;
    }).join('');
    const notesHtml = notesText
      ? `<section class="notes-block"><div class="section-label">Service notes</div><p>${escapePrintText(notesText)}</p></section>`
      : '';
    const totalsHtml = mode === 'receipt'
      ? `
        <section class="totals-block">
          <div class="section-label">Payment summary</div>
          <div class="totals-list">
            <div><span>Subtotal</span><strong>${escapePrintText(formatMoney(subtotalAmount))}</strong></div>
            <div><span>Discount</span><strong>- ${escapePrintText(formatMoney(discountAmount))}</strong></div>
            <div><span>Tax</span><strong>${escapePrintText(formatMoney(taxAmount))}</strong></div>
            <div><span>Service charge</span><strong>${escapePrintText(formatMoney(serviceChargeAmount))}</strong></div>
            <div class="total-row"><span>Total</span><strong>${escapePrintText(formatMoney(order.totalAmount))}</strong></div>
            <div><span>Paid</span><strong>${escapePrintText(formatMoney(paidAmount))}</strong></div>
            <div><span>Outstanding</span><strong>${escapePrintText(formatMoney(outstandingAmount))}</strong></div>
            <div><span>Payment</span><strong>${escapePrintText(getPaymentLabel(order))}</strong></div>
          </div>
        </section>
      `
      : `
        <section class="prep-block">
          <div class="section-label">Kitchen workflow</div>
          <p>Prepare the visible items in this ticket and update statuses in the kitchen display once they move forward.</p>
        </section>
      `;

    popup.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapePrintText(title)}</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family: Inter, 'Segoe UI', Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
            }

            .sheet {
              width: 100%;
            }

            .ticket-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 16px;
              padding-bottom: 14px;
              border-bottom: 2px solid #2b0a57;
            }

            .brand {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: -0.02em;
            }

            .brand-subtitle {
              margin-top: 4px;
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.14em;
            }

            .doc-chip {
              padding: 8px 12px;
              border-radius: 999px;
              background: #f1ebfb;
              color: #2b0a57;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              white-space: nowrap;
            }

            .hero {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 16px;
              padding: 16px 0 10px;
            }

            .eyebrow {
              margin: 0 0 6px;
              font-size: 11px;
              font-weight: 700;
              color: #7c3aed;
              text-transform: uppercase;
              letter-spacing: 0.14em;
            }

            .order-number {
              margin: 0;
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -0.03em;
            }

            .issued-at {
              font-size: 12px;
              font-weight: 600;
              color: #475569;
              text-align: right;
            }

            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin-top: 8px;
            }

            .meta-card {
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #f8fafc;
            }

            .meta-label,
            .section-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.14em;
            }

            .meta-value {
              margin-top: 6px;
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }

            .notes-block,
            .totals-block,
            .prep-block,
            .items-block {
              margin-top: 14px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 12px;
              background: #ffffff;
            }

            .notes-block {
              background: #fff7ed;
              border-color: #fed7aa;
            }

            .notes-block p,
            .prep-block p {
              margin: 8px 0 0;
              font-size: 13px;
              line-height: 1.5;
            }

            .section-head {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            }

            .section-title {
              margin: 0;
              font-size: 16px;
              font-weight: 800;
              letter-spacing: -0.02em;
            }

            .section-meta {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              padding: 0 0 8px;
              border-bottom: 1px solid #cbd5e1;
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              text-align: left;
            }

            td {
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              font-size: 13px;
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            .qty-cell {
              width: 40px;
              font-weight: 800;
              color: #2b0a57;
            }

            .item-name {
              font-weight: 700;
              color: #111827;
            }

            .item-note {
              margin-top: 4px;
              font-size: 11px;
              line-height: 1.5;
              color: #64748b;
            }

            .item-note {
              margin-top: 4px;
              font-size: 11px;
              line-height: 1.5;
              color: #64748b;
            }

            .status-cell {
              width: 92px;
              text-align: right;
            }

            .money-cell {
              width: 110px;
              text-align: right;
              font-weight: 700;
              white-space: nowrap;
            }

            .money-cell {
              width: 110px;
              text-align: right;
              font-weight: 700;
              white-space: nowrap;
            }

            .status-pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 76px;
              padding: 6px 10px;
              border-radius: 999px;
              background: #f1f5f9;
              color: #334155;
              font-size: 11px;
              font-weight: 700;
              text-transform: capitalize;
            }

            .totals-list {
              margin-top: 10px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              overflow: hidden;
            }

            .totals-list div {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 10px 12px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }

            .totals-list div:last-child {
              border-bottom: none;
            }

            .totals-list span {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            }

            .totals-list strong {
              font-size: 15px;
              color: #0f172a;
              text-align: right;
            }

            .totals-list .total-row {
              background: #efe7ff;
            }

            .totals-list .total-row span,
            .totals-list .total-row strong {
              color: #2b0a57;
              font-weight: 800;
            }

            .footer {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px dashed #cbd5e1;
              font-size: 11px;
              color: #64748b;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <header class="ticket-header">
              <div>
                <div class="brand">Sawingir Hills Hotel</div>
                <div class="brand-subtitle">Restaurant operations</div>
              </div>
              <div class="doc-chip">${escapePrintText(documentChip)}</div>
            </header>

            <section class="hero">
              <div>
                <p class="eyebrow">${mode === 'receipt' ? 'Guest receipt' : 'Kitchen order ticket'}</p>
                <h1 class="order-number">${escapePrintText(order.orderNumber)}</h1>
              </div>
              <div class="issued-at">${escapePrintText(issuedAt)}</div>
            </section>

            <section class="meta-grid">
              <div class="meta-card">
                <div class="meta-label">Location</div>
                <div class="meta-value">${escapePrintText(getLocationLabel(order))}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Guest</div>
                <div class="meta-value">${escapePrintText(getGuestName(order))}</div>
              </div>
              ${guestContact ? `<div class="meta-card"><div class="meta-label">Contact</div><div class="meta-value">${escapePrintText(guestContact)}</div></div>` : ''}
              <div class="meta-card">
                <div class="meta-label">Waiter</div>
                <div class="meta-value">${escapePrintText(getWaiterName(order))}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Status</div>
                <div class="meta-value">${escapePrintText(order.status.replace('_', ' '))}</div>
              </div>
            </section>

            ${notesHtml}

            <section class="items-block">
              <div class="section-head">
                <div>
                  <div class="section-label">Visible items</div>
                  <h2 class="section-title">Order items</h2>
                </div>
                <div class="section-meta">${escapePrintText(itemCount)} total</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Qty</th>
                    <th>Item</th>
                    ${mode === 'kitchen' ? '<th style="text-align:right;">Status</th>' : '<th style="text-align:right;">Unit</th><th style="text-align:right;">Line total</th>'}
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </section>

            ${totalsHtml}

            <footer class="footer">
              <span>${mode === 'receipt' ? 'Thank you for dining with Sawingir Hills.' : 'Use this ticket with the kitchen display for status updates.'}</span>
              <span>${escapePrintText(title)}</span>
            </footer>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading restaurant POS...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/80 bg-white/94 shadow-[0_14px_36px_rgba(70,26,115,0.05)]">
        <CardContent className="px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Restaurant service desk</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Restaurant POS</h1>
              <p className="mt-1 text-sm text-slate-600">Fast order entry, held tabs, room service, and live kitchen handoff.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeView === 'new' ? 'default' : 'outline'}
                className={activeView === 'new'
                  ? 'h-10 rounded-md bg-[color:var(--color-primary)] px-4 text-primary-foreground hover:bg-[color:var(--color-primary)]/92'
                  : 'h-10 rounded-md border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50'}
                onClick={() => setActiveView('new')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                POS terminal
              </Button>
              <Button
                variant={activeView === 'orders' ? 'default' : 'outline'}
                className={activeView === 'orders'
                  ? 'h-10 rounded-md bg-[color:var(--color-primary)] px-4 text-primary-foreground hover:bg-[color:var(--color-primary)]/92'
                  : 'h-10 rounded-md border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50'}
                onClick={() => setActiveView('orders')}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Order board
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tables</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <strong className="text-lg text-slate-950">{tables.length}</strong>
                <span className="text-xs text-slate-500">{availableTables} free</span>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kitchen queue</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <strong className="text-lg text-slate-950">{activeKitchenOrders}</strong>
                <span className="text-xs text-slate-500">active</span>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Held tabs</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <strong className="text-lg text-slate-950">{heldOrders.length}</strong>
                <span className="text-xs text-slate-500">waiting</span>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Room service</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <strong className="text-lg text-slate-950">{bookings.length}</strong>
                <span className="text-xs text-slate-500">checked in</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeView === 'new' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/80 bg-white/94">
              <CardContent className="px-4 py-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={menuSearch}
                      onChange={(event) => setMenuSearch(event.target.value)}
                      placeholder="Search menu items, categories, or descriptions"
                      className="h-11 rounded-md border-slate-300 bg-white pl-10 pr-10"
                    />
                    {menuSearch && (
                      <button
                        type="button"
                        onClick={() => setMenuSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Badge variant="outline" className="rounded-md border-slate-300 bg-slate-50 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-600">
                    {filteredMenuItems.length} items shown
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">Categories</div>
                    <div className="text-xs text-slate-500">Tap once to narrow the product wall.</div>
                  </div>
                  <div className="text-xs text-slate-500">{activeCategory === 'all' ? 'All categories' : categories.find((category) => String(category.id) === activeCategory)?.name}</div>
                </div>

                <ScrollArea className="mt-3 w-full whitespace-nowrap">
                  <div className="flex w-max gap-3 pb-2 pr-6">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className={activeCategory === 'all'
                        ? 'flex min-w-[104px] flex-col items-center rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] px-3 py-3 text-primary-foreground shadow-sm'
                        : 'flex min-w-[104px] flex-col items-center rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'}
                    >
                      <span className={activeCategory === 'all'
                        ? 'flex h-10 w-10 items-center justify-center rounded-md bg-white/12 text-sm font-semibold'
                        : 'flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700'}>
                        ALL
                      </span>
                      <span className="mt-2 text-sm font-medium">All</span>
                    </button>
                    {categories.map((category) => {
                      const active = activeCategory === String(category.id);
                      return (
                        <button
                          type="button"
                          key={category.id}
                          onClick={() => setActiveCategory(String(category.id))}
                          className={active
                            ? 'flex min-w-[104px] flex-col items-center rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] px-3 py-3 text-primary-foreground shadow-sm'
                            : 'flex min-w-[104px] flex-col items-center rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'}
                        >
                          <span className={active
                            ? 'flex h-10 w-10 items-center justify-center rounded-md bg-white/12 text-sm font-semibold uppercase'
                            : 'flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold uppercase text-slate-700'}>
                            {category.name.slice(0, 2)}
                          </span>
                          <span className="mt-2 line-clamp-2 text-center text-sm font-medium leading-5">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/80 bg-white/94">
              <CardHeader className="border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-slate-950">Product wall</CardTitle>
                    <p className="mt-1 text-sm text-slate-600">Dense, touch-friendly cards for quick order entry.</p>
                  </div>
                  <Badge variant="outline" className="rounded-md border-slate-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600">
                    {cartItemCount} in bill
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {filteredMenuItems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
                    No menu items match the current search and category filters.
                  </div>
                ) : (
                  <ScrollArea className="h-[64vh] pr-2">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {filteredMenuItems.map((item) => (
                        <Card key={item.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                          <div className="border-b border-slate-200 bg-slate-100">
                            <AspectRatio ratio={4 / 3}>
                              {item.imageUrl ? (
                                <ImageWithFallback src={item.imageUrl || undefined} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-slate-100 text-[11px] uppercase tracking-[0.16em] text-slate-500">No image</div>
                              )}
                            </AspectRatio>
                          </div>
                          <CardContent className="flex h-full flex-col pt-4">
                            <div className="min-h-[68px] space-y-1 text-center">
                              <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{item.name}</div>
                              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{item.category?.name || 'Menu item'}</div>
                            </div>

                            <div className="mt-3 flex min-h-[30px] items-center justify-center gap-2">
                              {item.isVegetarian && (
                                <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                                  Veg
                                </Badge>
                              )}
                              {item.isSpicy && (
                                <Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-700">
                                  Spicy
                                </Badge>
                              )}
                            </div>

                            <div className="mt-auto space-y-3 pt-3">
                              <div className="space-y-1 text-center">
                                <div className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--color-primary)]">{formatMoney(item.price)}</div>
                                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Prep {item.preparationTime} min</div>
                              </div>

                              <Button className="h-10 w-full rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92" onClick={() => addToCart(item)}>
                                Add to bill
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div ref={orderSummaryRef} className="space-y-4">
            <Card className="overflow-hidden border-border/80 bg-white/95 xl:sticky xl:top-6">
              <CardHeader className="border-b border-slate-200 bg-[oklch(0.95_0.03_102)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Current bill</div>
                    <CardTitle className="mt-1 text-xl text-slate-950">Active ticket</CardTitle>
                  </div>
                  <Badge variant="outline" className="rounded-md border-slate-300 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-700">
                    {cartItemCount} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                  <Button
                    variant={orderSource === 'table' ? 'default' : 'outline'}
                    className={orderSource === 'table'
                      ? 'h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92'
                      : 'h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}
                    onClick={() => setOrderSource('table')}
                  >
                    <TableProperties className="mr-2 h-4 w-4" />
                    Table
                  </Button>
                  <Button
                    variant={orderSource === 'room' ? 'default' : 'outline'}
                    className={orderSource === 'room'
                      ? 'h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92'
                      : 'h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}
                    onClick={() => setOrderSource('room')}
                  >
                    <Hotel className="mr-2 h-4 w-4" />
                    Room
                  </Button>
                </div>

                {editingOrder && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
                    Appending items to <strong>{editingOrder.orderNumber}</strong>.
                  </div>
                )}

                {orderSource === 'table' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Choose table</Label>
                      <span className="text-xs text-slate-500">{selectedTable ? `Serving ${selectedTable.name}` : 'Required before send'}</span>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border border-slate-200 bg-slate-50/70">
                      <div className="flex w-max gap-2 p-2 pr-6">
                        {tables.map((table) => (
                          <button
                            type="button"
                            key={table.id}
                            onClick={() => setTableNumber(table.code)}
                            className={tableNumber === table.code
                              ? 'min-w-[116px] rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] px-3 py-3 text-left text-primary-foreground'
                              : 'min-w-[116px] rounded-md border border-slate-200 bg-white px-3 py-3 text-left text-slate-800 hover:border-slate-300'}
                          >
                            <div className="text-sm font-semibold">T{table.code}</div>
                            <div className={tableNumber === table.code ? 'mt-1 text-[11px] uppercase tracking-[0.12em] text-white/80' : 'mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500'}>
                              {table.status.replace('_', ' ')}
                            </div>
                          </button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Checked-in booking</Label>
                    <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                      <SelectTrigger className="rounded-md border-slate-300 bg-white">
                        <SelectValue placeholder="Choose active room booking" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings.map((booking) => (
                          <SelectItem key={booking.id} value={String(booking.id)}>
                            {booking.bookingRef} | Room {booking.room?.roomNumber} | {booking.guest?.firstName} {booking.guest?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Guest / customer name</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder={orderSource === 'room' ? 'Optional if different from booking guest' : 'Walk-in guest or company name'}
                      className="rounded-md border-slate-300 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Contact number</Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Phone or WhatsApp number"
                      className="rounded-md border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {orderSource === 'room' && selectedBooking?.guest && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    Linked room guest: <span className="font-medium text-slate-950">{selectedBooking.guest.firstName} {selectedBooking.guest.lastName}</span>
                  </div>
                )}

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
                  <div className="border-b border-dashed border-slate-300 pb-3 text-center">
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Sawingir Hills</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-slate-950">Restaurant Bill</div>
                    <div className="mt-2 space-y-1 font-mono text-[12px] text-slate-600">
                      <div>{editingOrder ? editingOrder.orderNumber : 'Draft order'}</div>
                      <div>{orderSource === 'table' ? (selectedTable ? `Table ${selectedTable.code}` : 'Table not selected') : (selectedBooking?.room?.roomNumber ? `Room ${selectedBooking.room.roomNumber}` : 'Room not selected')}</div>
                      <div>{orderSource === 'table' ? 'DINE-IN' : 'ROOM SERVICE'}</div>
                    </div>
                    <div className="mt-3 space-y-1 rounded-md border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 font-mono text-[12px] text-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <span>Guest</span>
                        <span className="text-right font-semibold text-slate-950">{draftGuestName}</span>
                      </div>
                      {draftGuestContact && (
                        <div className="flex items-center justify-between gap-3">
                          <span>Contact</span>
                          <span className="text-right">{draftGuestContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-dashed border-slate-300 pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Amt</span>
                    </div>

                    {cart.length === 0 ? (
                      <div className="py-10 text-center font-mono text-sm text-slate-500">No items added yet</div>
                    ) : (
                      <ScrollArea className="h-[30vh] pr-2">
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div key={item.menuItemId} className="space-y-2 border-b border-dashed border-slate-200 pb-3 last:border-b-0 last:pb-0">
                              <div className="grid grid-cols-[1fr_auto_auto] gap-3 font-mono text-[12px] text-slate-900">
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{item.name}</div>
                                  <div className="text-[11px] text-slate-500">{formatMoney(item.price)} each</div>
                                </div>
                                <div className="pt-0.5 text-right">{item.quantity}</div>
                                <div className="pt-0.5 text-right font-semibold">{formatMoney(item.price * item.quantity)}</div>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md border-slate-300 bg-white p-0" onClick={() => updateCartQuantity(item.menuItemId, -1)}>-</Button>
                                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md border-slate-300 bg-white p-0" onClick={() => updateCartQuantity(item.menuItemId, 1)}>+</Button>
                                </div>
                                <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500">qty control</span>
                              </div>
                              {restaurantSettings.specialInstructionsEnabled && (
                                <Textarea
                                  rows={2}
                                  value={item.specialInstructions || ''}
                                  onChange={(event) => updateItemInstructions(item.menuItemId, event.target.value)}
                                  placeholder="Special instructions"
                                  className="rounded-md border-slate-300 bg-slate-50 text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-dashed border-slate-300 pt-3 font-mono text-[12px] text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span>Items</span>
                      <strong className="text-slate-950">{cartItemCount}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Subtotal</span>
                      <strong className="text-base text-slate-950">{formatMoney(subtotal)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-300 pt-2">
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Server calculates</span>
                      <strong className="text-[color:var(--color-primary)]">Tax + service + discount</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order-notes">Service notes</Label>
                  <Textarea
                    id="order-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Kitchen notes, allergy reminder, or cashier handover"
                    className="rounded-md border-slate-300 bg-white"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                  <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={resetComposer}>
                    Clear bill
                  </Button>
                  <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" disabled={submittingOrder} onClick={() => void submitOrder('hold')}>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Hold order
                  </Button>
                  <Button
                    className="h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92 sm:col-span-2"
                    disabled={submittingOrder}
                    onClick={() => void submitOrder('send')}
                  >
                    {submittingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChefHat className="mr-2 h-4 w-4" />}
                    {editingOrderId ? 'Add items to ticket' : 'Send to kitchen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="border-border/80 bg-white/92">
            <CardContent className="px-5 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-950">Live order board</div>
                  <p className="mt-1 text-sm text-slate-600">Track active tickets, held tabs, payment progress, and kitchen handoff in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={myOrdersOnly ? 'default' : 'outline'} onClick={() => setMyOrdersOnly((value) => !value)} className={myOrdersOnly ? 'h-10 rounded-md bg-[color:var(--color-primary)] px-4 text-primary-foreground hover:bg-[color:var(--color-primary)]/92' : 'h-10 rounded-md border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50'}>
                    <UserRound className="mr-2 h-4 w-4" />
                    My orders
                  </Button>
                  <Button variant={showHeldOnly ? 'default' : 'outline'} onClick={() => setShowHeldOnly((value) => !value)} className={showHeldOnly ? 'h-10 rounded-md bg-[color:var(--color-primary)] px-4 text-primary-foreground hover:bg-[color:var(--color-primary)]/92' : 'h-10 rounded-md border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50'}>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Held tabs
                  </Button>
                  <Button variant="outline" className="h-10 rounded-md border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={() => void loadData()}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {visibleOrders.length === 0 ? (
            <NoOrders />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleOrders.map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const paidAmount = getPaidAmount(order);
                const outstandingAmount = getOutstandingAmount(order);
                const orderExpanded = expandedOrderActionsId === order.id;
                const guestContact = getGuestContact(order.notes);
                const showApproveCancel = (user?.role === 'Administrator' || user?.role === 'Manager')
                  && order.status !== 'completed'
                  && order.status !== 'cancelled';
                const showRefund = (user?.role === 'Administrator' || user?.role === 'Manager')
                  && order.status === 'completed';

                return (
                  <Card key={order.id} className="overflow-hidden border-border/80 bg-white/95">
                    <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{getLocationLabel(order)}</div>
                          <CardTitle className="mt-2 text-xl text-slate-950">{order.orderNumber}</CardTitle>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>{getGuestName(order)}</span>
                            {guestContact && <span>{guestContact}</span>}
                            <span>Waiter: {getWaiterName(order)}</span>
                            <span>{formatPrintDate(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-row flex-wrap items-center gap-2 xl:justify-end">
                          {getStatusBadge(order.status)}
                          {isHeldOrder(order) && <Badge className="rounded-md border-amber-300 bg-amber-100 text-amber-800">Held tab</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">Visible order items</div>
                            <div className="text-xs text-slate-500">Staff should not have to expand the ticket to review food and notes.</div>
                          </div>
                          <Badge variant="outline" className="rounded-md border-slate-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600">{itemCount} qty</Badge>
                        </div>
                        <ScrollArea className="max-h-64">
                          <div className="space-y-2 p-3 text-sm">
                            {order.items.map((item) => (
                              <div key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-950">{item.quantity} x {item.menuItem.name}</div>
                                    {item.specialInstructions?.trim() && (
                                      <div className="mt-1 text-xs leading-5 text-amber-700">Special: {item.specialInstructions.trim()}</div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="rounded-md border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{item.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {visibleNotes(order.notes) && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Service notes</div>
                          <p className="mt-2 leading-6">{visibleNotes(order.notes)}</p>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total</div>
                          <div className="mt-2 text-base font-semibold text-slate-950">{formatMoney(order.totalAmount)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Paid</div>
                          <div className="mt-2 text-base font-semibold text-slate-950">{formatMoney(paidAmount)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Outstanding</div>
                          <div className="mt-2 text-base font-semibold text-slate-950">{formatMoney(outstandingAmount)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Payment</div>
                          <div className="mt-2 text-sm font-semibold text-slate-950">{getPaymentLabel(order)}</div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">Working actions</div>
                            <p className="mt-1 text-xs text-slate-500">Primary service actions stay visible. Printing and admin controls stay tucked away until needed.</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-md px-3 text-slate-700"
                            onClick={() => setExpandedOrderActionsId((current) => current === order.id ? null : order.id)}
                          >
                            {orderExpanded ? 'Hide extras' : 'More actions'}
                            {orderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {isHeldOrder(order) ? (
                            <Button className="h-11 rounded-md bg-amber-600 text-white hover:bg-amber-700" onClick={() => void releaseHeldOrder(order)}>
                              <Play className="mr-2 h-4 w-4" />
                              Release
                            </Button>
                          ) : null}

                          <Button
                            className="h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92"
                            disabled={!canModifyOrder(order)}
                            onClick={() => startAppend(order)}
                          >
                            Add items
                          </Button>

                          {order.status === 'ready' && (
                            <Button className="h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92" onClick={() => void markServed(order)}>
                              Mark served
                            </Button>
                          )}

                          {order.status === 'served' && (
                            <Button className="h-11 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => openPaymentDialog(order)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Capture payment
                            </Button>
                          )}
                        </div>

                        {orderExpanded && (
                          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2 xl:grid-cols-3">
                            {canPrintKitchen(order) && (
                              <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => printOrder(order, 'kitchen')}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print KOT
                              </Button>
                            )}

                            {canPrintReceipt(order) && (
                              <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => printOrder(order, 'receipt')}>
                                <Printer className="mr-2 h-4 w-4" />
                                Guest receipt
                              </Button>
                            )}

                            <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void requestVoid(order)}>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Void
                            </Button>

                            {showApproveCancel && (
                              <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void approveVoid(order)}>
                                Approve cancel
                              </Button>
                            )}

                            {showRefund && (
                              <Button variant="outline" className="h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => void refundOrder(order)}>
                                Refund
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === 'new' && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 px-4 2xl:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active ticket</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <span>{cartItemCount} items</span>
                <span className="text-slate-300">/</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>
            <Button variant="outline" className="h-11 shrink-0 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={scrollToSummary}>Review ticket</Button>
          </div>
        </div>
      )}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Capture payment</DialogTitle>
            <DialogDescription>Use one room charge or split the bill across one or more payment methods.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
              {paymentTarget ? `${paymentTarget.orderNumber} - outstanding ${formatMoney(getOutstandingAmount(paymentTarget))}` : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (LKR)</Label>
              <Input id="discount" type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} className="rounded-md" />
            </div>

            {paymentTarget?.orderType === 'room_service' && (
              <Button
                type="button"
                variant={useRoomCharge ? 'default' : 'outline'}
                className={useRoomCharge
                  ? 'h-11 rounded-md bg-[color:var(--color-primary)] text-primary-foreground hover:bg-[color:var(--color-primary)]/92'
                  : 'h-11 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}
                onClick={() => setUseRoomCharge((value) => !value)}
              >
                Use room charge
              </Button>
            )}

            {!useRoomCharge && (
              <div className="space-y-3">
                {paymentLines.map((line) => (
                  <div key={line.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <Select value={line.paymentMethod} onValueChange={(value: Exclude<PaymentMethod, 'room_charge'>) => updatePaymentLine(line.id, 'paymentMethod', value)}>
                      <SelectTrigger className="rounded-md"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={line.amount} onChange={(event) => updatePaymentLine(line.id, 'amount', event.target.value)} placeholder="Amount" className="rounded-md" />
                    <Button variant="outline" className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => removePaymentLine(line.id)}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline" className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={addPaymentLine}>Add payment line</Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-md bg-emerald-600 text-white hover:bg-emerald-700" disabled={payingOrder} onClick={() => void submitPayment()}>
              {payingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
















