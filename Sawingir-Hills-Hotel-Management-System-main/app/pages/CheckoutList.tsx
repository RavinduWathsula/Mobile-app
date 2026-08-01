import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Search, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface CheckoutRecord {
  id: number;
  bookingRef: string;
  checkIn: string;
  checkOut: string;
  balanceDue: number;
  guest: { firstName: string; lastName: string; phone?: string | null };
  room?: { roomNumber: string } | null;
  roomType: { name: string };
}

function formatCurrency(value: number) {
  return value > 0 ? `LKR ${value.toLocaleString()}` : 'Paid';
}

export function CheckoutList() {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<CheckoutRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [checkoutSubmittingId, setCheckoutSubmittingId] = useState<number | null>(null);

  const loadCheckouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTodayCheckouts();
      setCheckouts(data.map((checkout: any) => ({ ...checkout, balanceDue: Number(checkout.balanceDue || 0) })));
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load checkouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCheckouts();
  }, []);

  const filteredCheckouts = useMemo(() => checkouts.filter((checkout) => {
    const haystack = [checkout.bookingRef, checkout.guest.firstName, checkout.guest.lastName, checkout.room?.roomNumber || '', checkout.roomType.name].join(' ').toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  }), [checkouts, searchQuery]);

  const handleCheckout = async (checkoutId: number) => {
    try {
      setCheckoutSubmittingId(checkoutId);
      await api.updateBookingStatus(checkoutId, 'checked_out');
      toast.success('Guest checked out successfully');
      await loadCheckouts();
    } catch (statusError: any) {
      setError(statusError.message || 'Failed to check out guest');
    } finally {
      setCheckoutSubmittingId(null);
    }
  };

  const openPaymentDialog = (checkout: CheckoutRecord) => {
    setSelectedCheckout(checkout);
    setPaymentAmount(String(checkout.balanceDue));
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
    setDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedCheckout) return;
    try {
      setPaymentSubmitting(true);
      await api.recordBookingPayment(selectedCheckout.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNo: paymentReference || undefined,
        notes: paymentNotes || undefined,
      });
      toast.success('Payment recorded successfully');
      setDialogOpen(false);
      setSelectedCheckout(null);
      await loadCheckouts();
    } catch (paymentError: any) {
      setError(paymentError.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Checkouts</h1>
          <p className="mt-1 text-gray-500">Expected departures for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 text-lg">{filteredCheckouts.length} Expected</Badge>
          <Badge className="bg-red-500 px-4 py-2 text-lg">{filteredCheckouts.filter((checkout) => checkout.balanceDue > 0).length} With Balance</Badge>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by guest name, booking reference, or room number..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading checkouts...</div>
      ) : (
        <div className="space-y-4">
          {filteredCheckouts.map((checkout) => (
            <Card key={checkout.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{checkout.guest.firstName} {checkout.guest.lastName}</h3>
                      {checkout.balanceDue === 0 ? <Badge className="bg-green-500">Settled</Badge> : <Badge variant="outline" className="bg-red-50 text-red-700"><DollarSign className="mr-1 h-3 w-3" />Balance Due</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div><div className="mb-1 text-gray-500">Booking Ref</div><div className="font-medium">{checkout.bookingRef}</div></div>
                      <div><div className="mb-1 text-gray-500">Room</div><div className="font-medium">{checkout.room?.roomNumber || 'Unassigned'} - {checkout.roomType.name}</div></div>
                      <div><div className="mb-1 text-gray-500">Stay</div><div className="font-medium">{new Date(checkout.checkIn).toLocaleDateString()} - {new Date(checkout.checkOut).toLocaleDateString()}</div></div>
                      <div><div className="mb-1 text-gray-500">Outstanding Balance</div><div className={`font-bold ${checkout.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(checkout.balanceDue)}</div></div>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col gap-2">
                    {checkout.balanceDue > 0 ? (
                      <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => openPaymentDialog(checkout)}>Record payment</Button>
                    ) : (
                      <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90" onClick={() => void handleCheckout(checkout.id)} disabled={checkoutSubmittingId === checkout.id}>{checkoutSubmittingId === checkout.id ? 'Checking out...' : 'Check Out'}</Button>
                    )}
                    <Button variant="outline" onClick={() => navigate(`/booking?id=${checkout.id}&mode=view`)}>View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!filteredCheckouts.length && <div className="py-10 text-center text-gray-500">No checkouts found for today.</div>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle balance before checkout</DialogTitle>
            <DialogDescription>
              {selectedCheckout ? `${selectedCheckout.guest.firstName} ${selectedCheckout.guest.lastName} must clear the balance before checkout.` : 'Record a front-desk payment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
              <div className="font-medium text-slate-900">{selectedCheckout?.bookingRef}</div>
              <div className="mt-1 text-slate-600">Outstanding: {selectedCheckout ? `LKR ${selectedCheckout.balanceDue.toLocaleString()}` : 'LKR 0'}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="checkoutPaymentAmount">Amount</Label><Input id="checkoutPaymentAmount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /></div>
            <div className="space-y-2">
              <Label htmlFor="checkoutPaymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger id="checkoutPaymentMethod"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label htmlFor="checkoutPaymentReference">Reference No</Label><Input id="checkoutPaymentReference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional reference" /></div>
            <div className="space-y-2"><Label htmlFor="checkoutPaymentNotes">Notes</Label><Textarea id="checkoutPaymentNotes" value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Optional payment note" className="min-h-[90px]" /></div>
            <Button className="w-full bg-[#2B0A57] hover:bg-[#2B0A57]/90" disabled={paymentSubmitting || Number(paymentAmount) <= 0} onClick={() => void handleRecordPayment()}>{paymentSubmitting ? 'Recording payment...' : 'Record payment'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
