import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/booking_model.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/sheets/record_payment_sheet.dart';

class CheckOutScreen extends ConsumerStatefulWidget {
  final BookingModel booking;

  const CheckOutScreen({super.key, required this.booking});

  @override
  ConsumerState<CheckOutScreen> createState() => _CheckOutScreenState();
}

class _CheckOutScreenState extends ConsumerState<CheckOutScreen> {
  bool _keysReturned = false;
  bool _minibarChecked = false;
  bool _isProcessing = false;

  void _processCheckOut() async {
    // Refresh the booking to get the latest balance due in case a payment was just recorded
    final repo = ref.read(bookingsRepositoryProvider);
    BookingModel currentBooking;
    try {
      currentBooking = await repo.getBookingById(widget.booking.id);
    } catch (_) {
      currentBooking = widget.booking;
    }

    if (currentBooking.balanceDue > 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Cannot check-out. There is an outstanding balance.'),
          backgroundColor: Colors.red,
          action: SnackBarAction(
            label: 'PAY NOW',
            textColor: Colors.white,
            onPressed: () => RecordPaymentSheet.show(context, currentBooking).then((_) => setState((){})),
          ),
        ),
      );
      return;
    }

    if (!_keysReturned || !_minibarChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please ensure keys are returned and minibar is checked.')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      await repo.updateBookingStatus(currentBooking.id, 'checked_out');
      
      // Update room status to dirty
      if (currentBooking.roomId != null && currentBooking.roomId! > 0) {
        final roomRepo = ref.read(roomsRepositoryProvider);
        await roomRepo.updateRoomStatus(currentBooking.roomId!, 'dirty');
      }
      
      ref.invalidate(bookingsListProvider);
      ref.invalidate(bookingDetailProvider(currentBooking.id));
      ref.invalidate(todayCheckoutsProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(roomsListProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Check-out completed successfully!'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch the booking detail provider to get real-time balance updates if a payment is made on this screen
    final bookingAsync = ref.watch(bookingDetailProvider(widget.booking.id));
    final currentBooking = bookingAsync.valueOrNull ?? widget.booking;
    final hasBalance = currentBooking.balanceDue > 0;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Guest Check-Out', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: _isProcessing 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 600),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), shape: BoxShape.circle),
                            child: Icon(Icons.logout, color: Colors.blue.shade700, size: 32),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(currentBooking.guestFullName, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                                Text('Room: ${currentBooking.roomNumber ?? 'Unknown'}', style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Billing & Payment
                    const Text('Billing Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                        border: hasBalance ? Border.all(color: Colors.red.shade200, width: 2) : Border.all(color: Colors.green.shade200, width: 2),
                      ),
                      child: Column(
                        children: [
                          _buildAmountRow('Total Charges', currentBooking.totalAmount),
                          const Divider(height: 24),
                          _buildAmountRow('Total Paid', currentBooking.advancePaid, isGreen: true),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Balance Due', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              Text(
                                CurrencyFormatter.format(currentBooking.balanceDue),
                                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: hasBalance ? Colors.red : Colors.green),
                              ),
                            ],
                          ),
                          if (hasBalance) ...[
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () => RecordPaymentSheet.show(context, currentBooking),
                                icon: const Icon(Icons.payment),
                                label: const Text('COLLECT PAYMENT'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Check-out Checklist
                    const Text('Check-Out Requirements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
                      child: Column(
                        children: [
                          CheckboxListTile(
                            title: const Text('Keys / Key Cards Returned', style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: const Text('Ensure all issued keys are collected'),
                            value: _keysReturned,
                            onChanged: (val) => setState(() => _keysReturned = val ?? false),
                            activeColor: Colors.blue.shade700,
                          ),
                          const Divider(height: 1),
                          CheckboxListTile(
                            title: const Text('Minibar & Room Charges Checked', style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: const Text('Verify no additional consumption'),
                            value: _minibarChecked,
                            onChanged: (val) => setState(() => _minibarChecked = val ?? false),
                            activeColor: Colors.blue.shade700,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Action Button
                    ElevatedButton(
                      onPressed: hasBalance ? null : _processCheckOut,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: hasBalance ? Colors.grey : Colors.blue.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: hasBalance ? 0 : 4,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.logout, size: 24),
                          const SizedBox(width: 8),
                          Text(hasBalance ? 'PAYMENT REQUIRED TO CHECK OUT' : 'COMPLETE CHECK-OUT', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildAmountRow(String label, double amount, {bool isGreen = false}) {
    return Row(
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
        const Spacer(),
        Text(
          CurrencyFormatter.format(amount), 
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: isGreen ? Colors.green : Colors.black87),
        ),
      ],
    );
  }
}
