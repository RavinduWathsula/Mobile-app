import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../models/booking_request_models.dart';
import '../../widgets/loading/loading_indicator.dart';

class CreateBookingScreen extends ConsumerStatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  ConsumerState<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  // Step 1: Guest Info
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _idNumberCtrl = TextEditingController();

  // Step 2: Stay Dates
  DateTime? _checkIn;
  DateTime? _checkOut;

  // Step 3: Room Selection
  int? _selectedRoomTypeId;

  // Step 4: Rate & Meal Plan
  String _selectedMealPlan = 'room-only';

  // Step 5: Guest Count
  int _adults = 1;
  int _children = 0;

  // Step 6: Payment
  final _advanceAmountCtrl = TextEditingController();
  String _paymentMethod = 'cash';

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _idNumberCtrl.dispose();
    _advanceAmountCtrl.dispose();
    super.dispose();
  }

  void _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_checkIn == null || _checkOut == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select stay dates')),
      );
      return;
    }

    if (_selectedRoomTypeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a room type')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final guest = GuestRequest(
        firstName: _firstNameCtrl.text.trim(),
        lastName: _lastNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        idNumber: _idNumberCtrl.text.trim(),
      );

      final dateFormat = DateFormat('yyyy-MM-dd');
      final request = CreateBookingRequest(
        guest: guest,
        checkIn: dateFormat.format(_checkIn!),
        checkOut: dateFormat.format(_checkOut!),
        roomTypeId: _selectedRoomTypeId,
        adults: _adults,
        children: _children,
        mealPlan: _selectedMealPlan,
        source: 'walk_in',
      );

      final repo = ref.read(bookingsRepositoryProvider);
      final newBooking = await repo.createBooking(request);

      final advanceStr = _advanceAmountCtrl.text.trim();
      if (advanceStr.isNotEmpty) {
        final advance = double.tryParse(advanceStr) ?? 0;
        if (advance > 0) {
          await repo.recordPayment(
            newBooking.id,
            PaymentRequest(amount: advance, paymentMethod: _paymentMethod),
          );
        }
      }

      ref.invalidate(bookingsListProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: _checkIn != null && _checkOut != null
          ? DateTimeRange(start: _checkIn!, end: _checkOut!)
          : null,
    );

    if (picked != null) {
      setState(() {
        _checkIn = picked.start;
        _checkOut = picked.end;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final roomTypesAsync = ref.watch(roomTypesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Booking'),
      ),
      body: _isSubmitting
          ? const LoadingIndicator(message: 'Creating booking...')
          : Form(
              key: _formKey,
              child: Stepper(
                currentStep: _currentStep,
                onStepContinue: () {
                  if (_currentStep < 5) {
                    setState(() => _currentStep += 1);
                  } else {
                    _submitForm();
                  }
                },
                onStepCancel: () {
                  if (_currentStep > 0) {
                    setState(() => _currentStep -= 1);
                  } else {
                    Navigator.pop(context);
                  }
                },
                controlsBuilder: (context, details) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: Row(
                      children: [
                        ElevatedButton(
                          onPressed: details.onStepContinue,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2B0A57),
                            foregroundColor: Colors.white,
                          ),
                          child: Text(_currentStep == 5 ? 'Confirm Booking' : 'Continue'),
                        ),
                        const SizedBox(width: 12),
                        if (_currentStep > 0)
                          TextButton(
                            onPressed: details.onStepCancel,
                            child: const Text('Back'),
                          ),
                      ],
                    ),
                  );
                },
                steps: [
                  Step(
                    title: const Text('Guest Info'),
                    isActive: _currentStep >= 0,
                    state: _currentStep > 0 ? StepState.complete : StepState.indexed,
                    content: Column(
                      children: [
                        TextFormField(
                          controller: _firstNameCtrl,
                          decoration: const InputDecoration(labelText: 'First Name *', border: OutlineInputBorder()),
                          validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _lastNameCtrl,
                          decoration: const InputDecoration(labelText: 'Last Name *', border: OutlineInputBorder()),
                          validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phoneCtrl,
                          decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _emailCtrl,
                          decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
                          keyboardType: TextInputType.emailAddress,
                        ),
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Stay Dates'),
                    isActive: _currentStep >= 1,
                    state: _currentStep > 1 ? StepState.complete : StepState.indexed,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        OutlinedButton.icon(
                          onPressed: _selectDateRange,
                          icon: const Icon(Icons.calendar_month),
                          label: Text(_checkIn == null 
                              ? 'Select Check-in & Check-out Dates' 
                              : '${DateFormat('dd MMM yyyy').format(_checkIn!)} - ${DateFormat('dd MMM yyyy').format(_checkOut!)}'),
                        ),
                        if (_checkIn != null && _checkOut != null)
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              '${_checkOut!.difference(_checkIn!).inDays} Nights',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Room Selection'),
                    isActive: _currentStep >= 2,
                    state: _currentStep > 2 ? StepState.complete : StepState.indexed,
                    content: roomTypesAsync.when(
                      loading: () => const CircularProgressIndicator(),
                      error: (err, stack) => Text('Error loading room types: $err'),
                      data: (types) {
                        return DropdownButtonFormField<int>(
                          decoration: const InputDecoration(labelText: 'Room Type *', border: OutlineInputBorder()),
                          initialValue: _selectedRoomTypeId,
                          items: types.map((t) => DropdownMenuItem<int>(
                            value: t['id'] as int,
                            child: Text(t['name']),
                          )).toList(),
                          onChanged: (val) => setState(() => _selectedRoomTypeId = val),
                        );
                      },
                    ),
                  ),
                  Step(
                    title: const Text('Rate / Meal Plan'),
                    isActive: _currentStep >= 3,
                    state: _currentStep > 3 ? StepState.complete : StepState.indexed,
                    content: DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'Meal Plan', border: OutlineInputBorder()),
                      initialValue: _selectedMealPlan,
                      items: const [
                        DropdownMenuItem(value: 'room-only', child: Text('Room Only')),
                        DropdownMenuItem(value: 'bnb', child: Text('Bed & Breakfast (B&B)')),
                        DropdownMenuItem(value: 'half-board', child: Text('Half Board')),
                        DropdownMenuItem(value: 'full-board', child: Text('Full Board')),
                      ],
                      onChanged: (val) => setState(() => _selectedMealPlan = val!),
                    ),
                  ),
                  Step(
                    title: const Text('Guest Count'),
                    isActive: _currentStep >= 4,
                    state: _currentStep > 4 ? StepState.complete : StepState.indexed,
                    content: Row(
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
                  ),
                  Step(
                    title: const Text('Payment (Optional)'),
                    isActive: _currentStep >= 5,
                    state: StepState.indexed,
                    content: Column(
                      children: [
                        TextFormField(
                          controller: _advanceAmountCtrl,
                          decoration: const InputDecoration(labelText: 'Advance Payment (Rs.)', border: OutlineInputBorder(), prefixText: 'Rs. '),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          decoration: const InputDecoration(labelText: 'Payment Method', border: OutlineInputBorder()),
                          initialValue: _paymentMethod,
                          items: const [
                            DropdownMenuItem(value: 'cash', child: Text('Cash')),
                            DropdownMenuItem(value: 'card', child: Text('Card')),
                            DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                          ],
                          onChanged: (val) => setState(() => _paymentMethod = val!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
