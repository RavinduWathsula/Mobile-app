import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../models/booking_model.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/sheets/record_payment_sheet.dart';
import 'edit_booking_screen.dart';
import 'check_in_screen.dart';
import 'check_out_screen.dart';

class BookingDetailScreen extends ConsumerStatefulWidget {
  final int bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  bool _isProcessing = false;

  void _confirmCheckIn(BookingModel booking) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CheckInScreen(booking: booking)),
    );
    if (result == true) {
      ref.invalidate(bookingDetailProvider(widget.bookingId));
    }
  }

  void _confirmCheckOut(BookingModel booking) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CheckOutScreen(booking: booking)),
    );
    if (result == true) {
      ref.invalidate(bookingDetailProvider(widget.bookingId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingAsync = ref.watch(bookingDetailProvider(widget.bookingId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking #${widget.bookingId}'),
        actions: [
          if (bookingAsync.valueOrNull != null)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => EditBookingScreen(booking: bookingAsync.value!)),
                ).then((_) => ref.invalidate(bookingDetailProvider(widget.bookingId)));
              },
            ),
        ],
      ),
      body: _isProcessing 
          ? const LoadingIndicator(message: 'Processing...')
          : bookingAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading details...'),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (booking) {
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
              title: Text(booking.roomTypeName ?? 'Unassigned Room Type'),
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
            onPressed: () => RecordPaymentSheet.show(context, booking),
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
