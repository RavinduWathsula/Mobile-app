import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/booking_model.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../core/theme/app_colors.dart';

class CheckInScreen extends ConsumerStatefulWidget {
  final BookingModel booking;

  const CheckInScreen({super.key, required this.booking});

  @override
  ConsumerState<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends ConsumerState<CheckInScreen> {
  bool _idCollected = false;
  bool _registrationSigned = false;
  int _keyCardsIssued = 1;
  bool _isProcessing = false;

  void _processCheckIn() async {
    if (!_idCollected || !_registrationSigned) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please collect ID and ensure registration card is signed.')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      final repo = ref.read(bookingsRepositoryProvider);
      await repo.updateBookingStatus(widget.booking.id, 'checked_in');
      
      // Invalidate relevant providers
      ref.invalidate(bookingsListProvider);
      ref.invalidate(bookingDetailProvider(widget.booking.id));
      ref.invalidate(todayArrivalsProvider);
      ref.invalidate(upcomingArrivalsProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(roomsListProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Check-in completed successfully!'), backgroundColor: AppColors.success),
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
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Guest Check-In', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
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
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.person, color: AppColors.primary, size: 32),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(widget.booking.guestFullName, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                                Text('Booking Ref: ${widget.booking.bookingRef}', style: TextStyle(color: Colors.grey.shade600)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Room & Stay Details
                    const Text('Stay Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
                      child: Column(
                        children: [
                          _buildDetailRow(Icons.king_bed, 'Room', widget.booking.roomNumber ?? 'Not Assigned (Will auto-assign)'),
                          const Divider(height: 24),
                          _buildDetailRow(Icons.calendar_today, 'Check-Out', widget.booking.checkOut),
                          const Divider(height: 24),
                          _buildDetailRow(Icons.group, 'Guests', '${widget.booking.adults} Adults, ${widget.booking.children} Children'),
                          const Divider(height: 24),
                          _buildDetailRow(Icons.restaurant, 'Meal Plan', widget.booking.mealPlan.toUpperCase().replaceAll('_', ' ')),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Check-in Checklist
                    const Text('Check-In Requirements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
                      child: Column(
                        children: [
                          CheckboxListTile(
                            title: const Text('Verify Guest ID / Passport', style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: const Text('Ensure the name matches the reservation'),
                            value: _idCollected,
                            onChanged: (val) => setState(() => _idCollected = val ?? false),
                            activeColor: AppColors.primary,
                          ),
                          const Divider(height: 1),
                          CheckboxListTile(
                            title: const Text('Registration Card Signed', style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: const Text('Guest must sign the digital or physical card'),
                            value: _registrationSigned,
                            onChanged: (val) => setState(() => _registrationSigned = val ?? false),
                            activeColor: AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Key Cards
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                                child: const Icon(Icons.key, color: Colors.blue),
                              ),
                              const SizedBox(width: 16),
                              const Text('Issue Key Cards', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Row(
                            children: [
                              IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => setState(() { if (_keyCardsIssued > 1) _keyCardsIssued--; })),
                              Text('$_keyCardsIssued', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                              IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => setState(() => _keyCardsIssued++)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Action Button
                    ElevatedButton(
                      onPressed: _processCheckIn,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.login, size: 24),
                          SizedBox(width: 8),
                          Text('COMPLETE CHECK-IN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
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

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey.shade600, size: 20),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }
}
