import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/services_provider.dart';
import '../../models/booking_model.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../core/utils/formatters.dart';

class BookingDetailScreen extends ConsumerStatefulWidget {
  final int bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  bool _isLoading = false;
  BookingModel? _booking;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBookingDetails();
  }

  Future<void> _loadBookingDetails() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final booking = await repo.getBookingById(widget.bookingId);
      setState(() {
        _booking = booking;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final updated = await repo.updateBookingStatus(widget.bookingId, status);
      setState(() {
        _booking = updated;
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking updated to ${status.toUpperCase()}')),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('ApiException: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Booking Details')),
        body: const LoadingIndicator(message: 'Loading booking information...'),
      );
    }

    if (_errorMessage != null || _booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Booking Details')),
        body: EmptyStateView(
          title: 'Error loading booking',
          description: _errorMessage ?? 'Booking not found',
          onRetry: _loadBookingDetails,
        ),
      );
    }

    final booking = _booking!;

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking ${booking.bookingRef}'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadBookingDetails),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                booking.bookingRef,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              StatusBadge(status: booking.status),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Guest Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  Text('Name: ${booking.guestFullName}', style: const TextStyle(fontSize: 15)),
                  if (booking.guestPhone != null) Text('Phone: ${booking.guestPhone}', style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Stay Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  Text('Room Number: ${booking.roomNumber ?? "Unassigned"}'),
                  Text('Room Type: ${booking.roomTypeName ?? "N/A"}'),
                  Text('Check-in: ${Formatters.formatDate(booking.checkIn)}'),
                  Text('Check-out: ${Formatters.formatDate(booking.checkOut)}'),
                  Text('Nights: ${booking.nights} | Guests: ${booking.adults} Adults, ${booking.children} Children'),
                  Text('Meal Plan: ${booking.mealPlan.toUpperCase()}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Payment Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount:'),
                      Text(Formatters.formatCurrency(booking.totalAmount), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Advance Paid:'),
                      Text(Formatters.formatCurrency(booking.advancePaid), style: const TextStyle(color: Colors.green)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Balance Due:'),
                      Text(Formatters.formatCurrency(booking.balanceDue), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (booking.status == 'confirmed')
            PrimaryButton(
              text: 'Perform Check-In',
              icon: Icons.login,
              onPressed: () => _updateStatus('checked_in'),
            ),
          if (booking.status == 'checked_in')
            PrimaryButton(
              text: 'Perform Check-Out',
              icon: Icons.logout,
              onPressed: () => _updateStatus('checked_out'),
            ),
        ],
      ),
    );
  }
}
