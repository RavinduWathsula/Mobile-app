import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Clock, Search, CheckCircle, Loader2, BedDouble } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface ArrivalRecord {
  id: number;
  bookingRef: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guest: { firstName: string; lastName: string; phone?: string | null };
  room?: { id: number; roomNumber: string } | null;
  roomType: { id: number; name: string };
}

export function ArrivalList() {
  const navigate = useNavigate();
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArrival, setSelectedArrival] = useState<ArrivalRecord | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const loadArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTodayArrivals();
      setArrivals(data);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load arrivals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArrivals();
  }, []);

  const filteredArrivals = useMemo(() => arrivals.filter((arrival) => {
    const haystack = [arrival.bookingRef, arrival.guest.firstName, arrival.guest.lastName, arrival.room?.roomNumber || '', arrival.roomType.name].join(' ').toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  }), [arrivals, searchQuery]);

  const handleCheckIn = async (arrival: ArrivalRecord, roomId?: number) => {
    try {
      setCheckingIn(true);
      setError(null);
      await api.updateBookingStatus(arrival.id, 'checked_in', roomId ? { roomId } : undefined);
      toast.success(`${arrival.guest.firstName} ${arrival.guest.lastName} checked in`);
      setDialogOpen(false);
      setSelectedArrival(null);
      setSelectedRoomId('');
      await loadArrivals();
    } catch (statusError: any) {
      setError(statusError.message || 'Failed to check in guest');
    } finally {
      setCheckingIn(false);
    }
  };

  const openAssignmentDialog = async (arrival: ArrivalRecord) => {
    try {
      setDialogOpen(true);
      setSelectedArrival(arrival);
      setSelectedRoomId('');
      const response = await api.getRooms({
        status: 'available',
        type: arrival.roomType.id,
        checkIn: String(arrival.checkIn).slice(0, 10),
        checkOut: String(arrival.checkOut).slice(0, 10),
        limit: 100,
      });
      setAvailableRooms(response.data || []);
    } catch (roomError: any) {
      setError(roomError.message || 'Failed to load available rooms');
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Arrivals</h1>
          <p className="mt-1 text-gray-500">Expected check-ins for {new Date().toLocaleDateString()}</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-lg">{filteredArrivals.length} Expected</Badge>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by guest name, booking reference, or room type..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading arrivals...</div>
      ) : (
        <div className="space-y-4">
          {filteredArrivals.map((arrival) => (
            <Card key={arrival.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{arrival.guest.firstName} {arrival.guest.lastName}</h3>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="mr-1 h-3 w-3" />Pending Check-in</Badge>
                      {arrival.room?.roomNumber && <Badge className="bg-emerald-600">Room {arrival.room.roomNumber} assigned</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div><div className="mb-1 text-gray-500">Booking Ref</div><div className="font-medium">{arrival.bookingRef}</div></div>
                      <div><div className="mb-1 text-gray-500">Room Type</div><div className="font-medium">{arrival.roomType.name}</div></div>
                      <div><div className="mb-1 text-gray-500">Assigned Room</div><div className="font-medium">{arrival.room?.roomNumber || 'Assign at front desk'}</div></div>
                      <div><div className="mb-1 text-gray-500">Guests</div><div className="font-medium">{arrival.adults} Adult{arrival.adults > 1 ? 's' : ''}{arrival.children > 0 ? `, ${arrival.children} Child${arrival.children > 1 ? 'ren' : ''}` : ''}</div></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4 text-sm text-gray-600">
                      <span>Check-out: {new Date(arrival.checkOut).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>{Math.ceil((new Date(arrival.checkOut).getTime() - new Date(arrival.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col gap-2">
                    {arrival.room?.id ? (
                      <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90" onClick={() => void handleCheckIn(arrival)} disabled={checkingIn}><CheckCircle className="mr-2 h-4 w-4" />Check In</Button>
                    ) : (
                      <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90" onClick={() => void openAssignmentDialog(arrival)}><BedDouble className="mr-2 h-4 w-4" />Assign room and check in</Button>
                    )}
                    <Button variant="outline" onClick={() => navigate(`/booking?id=${arrival.id}&mode=view`)}>View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!filteredArrivals.length && <div className="py-10 text-center text-gray-500">No arrivals found for today.</div>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign room before check-in</DialogTitle>
            <DialogDescription>
              {selectedArrival ? `Pick a live room for ${selectedArrival.guest.firstName} ${selectedArrival.guest.lastName}.` : 'Choose a room for this arrival.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">{selectedArrival?.bookingRef}</div>
              <div className="mt-1">{selectedArrival?.roomType.name}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalRoom">Available room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="arrivalRoom"><SelectValue placeholder="Select an available room" /></SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>Room {room.roomNumber} • Floor {room.floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!availableRooms.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No rooms are currently available for this room type and date range.</div>}
            <Button className="w-full bg-[#2B0A57] hover:bg-[#2B0A57]/90" disabled={!selectedArrival || !selectedRoomId || checkingIn} onClick={() => selectedArrival && void handleCheckIn(selectedArrival, Number(selectedRoomId))}>{checkingIn ? 'Checking in...' : 'Confirm room and check in'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

