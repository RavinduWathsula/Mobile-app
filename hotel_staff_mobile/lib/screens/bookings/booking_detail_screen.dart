import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../models/booking_model.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading/loading_indicator.dart';

class BookingDetailScreen extends ConsumerStatefulWidget {
  final int bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  bool _isProcessing = false;

  Future<void> _handleStatusUpdate(String status, String successMessage) async {
    setState(() => _isProcessing = true);
    try {
      final repo = ref.read(bookingsRepositoryProvider);
      await repo.updateBookingStatus(widget.bookingId, status);
      
      // Refresh all relevant providers
      ref.invalidate(bookingsListProvider);
      ref.invalidate(todayArrivalsProvider);
      ref.invalidate(upcomingArrivalsProvider);
      ref.invalidate(todayCheckoutsProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _confirmCheckIn(BookingModel booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Check-In'),
        content: Text('Check in ${booking.guestFullName} for room ${booking.roomNumber ?? 'TBD'}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _handleStatusUpdate('checked_in', 'Guest checked in successfully.');
            },
            child: const Text('CHECK IN'),
          ),
        ],
      ),
    );
  }

  void _confirmCheckOut(BookingModel booking) {
    final hasBalance = booking.balanceDue > 0;
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Check-Out'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Check out ${booking.guestFullName} from room ${booking.roomNumber ?? 'N/A'}?'),
            if (hasBalance) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(8),
                color: Colors.red.withOpacity(0.1),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Outstanding balance: ${CurrencyFormatter.format(booking.balanceDue)}',
                        style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text('Are you sure you want to proceed without collecting payment?'),
            ]
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _handleStatusUpdate('checked_out', 'Guest checked out successfully.');
            },
            style: ElevatedButton.styleFrom(backgroundColor: hasBalance ? Colors.red : Colors.blue, foregroundColor: Colors.white),
            child: const Text('CHECK OUT'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking #${widget.bookingId}'),
      ),
      body: _isProcessing 
          ? const LoadingIndicator(message: 'Processing...')
          : bookingsAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading details...'),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (bookings) {
                final booking = bookings.firstWhere(
                  (b) => b.id == widget.bookingId,
                  orElse: () => throw Exception('Booking not found'),
                );

                return SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildHeader(booking),
                      const SizedBox(height: 16),
                      _buildGuestInfo(booking),
                      const SizedBox(height: 16),
                      _buildRoomInfo(booking),
                      const SizedBox(height: 16),
                      _buildPaymentInfo(booking),
                      const SizedBox(height: 24),
                      _buildActions(context, booking),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildHeader(BookingModel booking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(booking.bookingRef, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Chip(
                  label: Text(booking.status.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 12)),
                  backgroundColor: _getStatusColor(booking.status),
                ),
              ],
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Text('Check-in', style: TextStyle(color: Colors.grey)),
                    Text(booking.checkIn.isNotEmpty ? DateFormat('dd MMM yyyy').format(DateTime.parse(booking.checkIn)) : 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const Icon(Icons.arrow_forward_outlined, color: Colors.grey),
                Column(
                  children: [
                    const Text('Check-out', style: TextStyle(color: Colors.grey)),
                    Text(booking.checkOut.isNotEmpty ? DateFormat('dd MMM yyyy').format(DateTime.parse(booking.checkOut)) : 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('${booking.nights} Nights • ${booking.adults} Adults, ${booking.children} Children', style: const TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestInfo(BookingModel booking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Guest Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(booking.guestFullName),
              subtitle: Text(booking.guestPhone ?? 'No Phone'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (booking.guestPhone != null)
                    IconButton(icon: const Icon(Icons.phone, color: Colors.green), onPressed: () {}),
                  if (booking.guestEmail != null)
                    IconButton(icon: const Icon(Icons.email, color: Colors.blue), onPressed: () {}),
                ],
              ),
            ),
            if (booking.guestEmail != null)
              Padding(padding: const EdgeInsets.only(top: 8), child: Text('Email: ${booking.guestEmail}')),
            if (booking.guestNationality != null)
              Padding(padding: const EdgeInsets.only(top: 8), child: Text('Nationality: ${booking.guestNationality}')),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomInfo(BookingModel booking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Room & Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.king_bed),
              title: Text('${booking.roomTypeName ?? 'Unassigned Room Type'}'),
              subtitle: Text('Room Number: ${booking.roomNumber ?? 'Not Assigned'}'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.restaurant),
              title: const Text('Meal Plan'),
              subtitle: Text(booking.mealPlan.toUpperCase().replaceAll('_', ' ')),
            ),
            if (booking.specialRequests != null && booking.specialRequests!.isNotEmpty)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.note),
                title: const Text('Special Requests'),
                subtitle: Text(booking.specialRequests!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo(BookingModel booking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payment Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            _buildAmountRow('Total Amount', booking.totalAmount, isBold: true),
            _buildAmountRow('Advance Paid', booking.advancePaid, color: Colors.green),
            const Divider(),
            _buildAmountRow('Balance Due', booking.balanceDue, isBold: true, color: booking.balanceDue > 0 ? Colors.red : Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountRow(String label, double amount, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: 16)),
          Text(
            CurrencyFormatter.format(amount),
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: 16,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, BookingModel booking) {
    return Column(
      children: [
        if (booking.status == 'confirmed')
          ElevatedButton.icon(
            onPressed: () => _confirmCheckIn(booking),
            icon: const Icon(Icons.login),
            label: const Text('Check-In Guest'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        const SizedBox(height: 12),
        if (booking.status == 'checked_in')
          ElevatedButton.icon(
            onPressed: () => _confirmCheckOut(booking),
            icon: const Icon(Icons.logout),
            label: const Text('Check-Out Guest'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        const SizedBox(height: 12),
        if (booking.balanceDue > 0 && (booking.status == 'confirmed' || booking.status == 'checked_in'))
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.payment),
            label: const Text('Record Payment'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed': return Colors.blue;
      case 'checked_in': return Colors.green;
      case 'checked_out': return Colors.grey;
      case 'cancelled': return Colors.red;
      case 'no_show': return Colors.orange;
      default: return Colors.grey;
    }
  }
}
