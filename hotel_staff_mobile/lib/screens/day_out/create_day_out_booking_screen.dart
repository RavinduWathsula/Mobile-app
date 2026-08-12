import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/day_out_model.dart';
import '../../providers/day_out_provider.dart';
import '../../widgets/loading/loading_indicator.dart';

class CreateDayOutBookingScreen extends ConsumerStatefulWidget {
  const CreateDayOutBookingScreen({super.key});

  @override
  ConsumerState<CreateDayOutBookingScreen> createState() => _CreateDayOutBookingScreenState();
}

class _CreateDayOutBookingScreenState extends ConsumerState<CreateDayOutBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _guestNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _requestsCtrl = TextEditingController();

  int? _selectedPlanId;
  DateTime? _bookingDate;
  int _adults = 1;
  int _children = 0;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _guestNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _requestsCtrl.dispose();
    super.dispose();
  }

  void _submitForm(List<DayOutPlan> plans) async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPlanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a plan')));
      return;
    }
    if (_bookingDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a date')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final selectedPlan = plans.firstWhere((p) => p.id == _selectedPlanId);
      final totalAmount = (_adults * selectedPlan.adultPrice) + (_children * selectedPlan.childPrice);

      final newBooking = DayOutBooking(
        id: 0,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        guestName: _guestNameCtrl.text.trim(),
        guestEmail: _emailCtrl.text.trim(),
        guestPhone: _phoneCtrl.text.trim(),
        adults: _adults,
        children: _children,
        totalAmount: totalAmount,
        bookingDate: DateFormat('yyyy-MM-dd').format(_bookingDate ?? DateTime.now()),
        status: 'confirmed',
        paymentStatus: 'pending',
        specialRequests: _requestsCtrl.text.trim(),
        createdAt: DateTime.now().toIso8601String(),
      );

      final repo = ref.read(dayOutRepositoryProvider);
      await repo.createBooking(newBooking);

      ref.invalidate(dayOutBookingsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reservation created!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(dayOutPlansProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('New Day Out Reservation')),
      body: _isSubmitting
          ? const LoadingIndicator(message: 'Creating...')
          : plansAsync.when(
              loading: () => const LoadingIndicator(),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (plans) {
                final activePlans = plans.where((p) => p.status == 'active').toList();
                
                double total = 0;
                if (_selectedPlanId != null) {
                  final p = activePlans.firstWhere((e) => e.id == _selectedPlanId, orElse: () => activePlans.first);
                  total = (_adults * p.adultPrice) + (_children * p.childPrice);
                }

                return Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      DropdownButtonFormField<int>(
                        decoration: const InputDecoration(labelText: 'Select Plan *', border: OutlineInputBorder()),
                        initialValue: _selectedPlanId,
                        items: activePlans.map((p) => DropdownMenuItem(
                          value: p.id,
                          child: Text('${p.name} (Rs.${p.adultPrice})'),
                        )).toList(),
                        onChanged: (val) => setState(() => _selectedPlanId = val),
                        validator: (val) => val == null ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _guestNameCtrl,
                        decoration: const InputDecoration(labelText: 'Guest Name *', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _phoneCtrl,
                              decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
                              keyboardType: TextInputType.phone,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _emailCtrl,
                              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                              keyboardType: TextInputType.emailAddress,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (date != null) setState(() => _bookingDate = date);
                        },
                        icon: const Icon(Icons.calendar_today),
                        label: Text(_bookingDate == null 
                            ? 'Select Date *' 
                            : DateFormat('dd MMM yyyy').format(_bookingDate!)),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Adults'),
                                Row(
                                  children: [
                                    IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => setState(() { if (_adults > 1) _adults--; })),
                                    Text('$_adults', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                    IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => setState(() => _adults++)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Children'),
                                Row(
                                  children: [
                                    IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => setState(() { if (_children > 0) _children--; })),
                                    Text('$_children', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                    IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => setState(() => _children++)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _requestsCtrl,
                        decoration: const InputDecoration(labelText: 'Special Requests', border: OutlineInputBorder()),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      if (_selectedPlanId != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total Amount:', style: TextStyle(fontWeight: FontWeight.bold)),
                              Text('Rs. $total', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.purple)),
                            ],
                          ),
                        ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => _submitForm(activePlans),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: const Color(0xFF2B0A57),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Create Reservation'),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
