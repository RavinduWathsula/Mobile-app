import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../models/booking_request_models.dart';
import '../../models/booking_model.dart';
import '../../widgets/loading/loading_indicator.dart';

class EditBookingScreen extends ConsumerStatefulWidget {
  final BookingModel booking;

  const EditBookingScreen({super.key, required this.booking});

  @override
  ConsumerState<EditBookingScreen> createState() => _EditBookingScreenState();
}

class _EditBookingScreenState extends ConsumerState<EditBookingScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  // Step 1: Guest Info
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _idNumberCtrl;

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

  @override
  void initState() {
    super.initState();
    _firstNameCtrl = TextEditingController(text: widget.booking.guestFirstName ?? '');
    _lastNameCtrl = TextEditingController(text: widget.booking.guestLastName ?? '');
    _emailCtrl = TextEditingController(text: widget.booking.guestEmail ?? '');
    _phoneCtrl = TextEditingController(text: widget.booking.guestPhone ?? '');
    _idNumberCtrl = TextEditingController(text: widget.booking.guestIdNumber ?? '');

    if (widget.booking.checkIn.isNotEmpty) {
      _checkIn = DateTime.tryParse(widget.booking.checkIn);
    }
    if (widget.booking.checkOut.isNotEmpty) {
      _checkOut = DateTime.tryParse(widget.booking.checkOut);
    }

    _selectedRoomTypeId = widget.booking.roomTypeId;
    
    final plan = widget.booking.mealPlan;
    if (plan == 'bnb' || plan == 'half_board' || plan == 'full_board' || plan == 'half-board' || plan == 'full-board') {
       _selectedMealPlan = plan.replaceAll('_', '-');
    } else {
       _selectedMealPlan = 'room-only';
    }

    _adults = widget.booking.adults > 0 ? widget.booking.adults : 1;
    _children = widget.booking.children;
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _idNumberCtrl.dispose();
    super.dispose();
  }

  void _submitForm() async {
    final state = _formKey.currentState;
    if (state == null || !state.validate()) return;
    
    final ci = _checkIn;
    final co = _checkOut;
    if (ci == null || co == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select stay dates')),
      );
      return;
    }

    if (co.difference(ci).inDays <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Check-out date must be after check-in date')),
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
        id: widget.booking.guestId,
        firstName: _firstNameCtrl.text.trim(),
        lastName: _lastNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        idNumber: _idNumberCtrl.text.trim(),
      );

      final dateFormat = DateFormat('yyyy-MM-dd');
      final request = UpdateBookingRequest(
        guest: guest,
        checkIn: dateFormat.format(ci),
        checkOut: dateFormat.format(co),
        roomTypeId: _selectedRoomTypeId,
        roomId: widget.booking.roomId,
        adults: _adults,
        children: _children,
        mealPlan: _selectedMealPlan,
        source: widget.booking.source,
      );

      final repo = ref.read(bookingsRepositoryProvider);
      await repo.updateBooking(widget.booking.id, request);

      ref.invalidate(bookingsListProvider);
      ref.invalidate(bookingDetailProvider(widget.booking.id));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking updated successfully!')),
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
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
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

  double _calculateTotal(List<Map<String, dynamic>> roomTypes) {
    final ci = _checkIn;
    final co = _checkOut;
    if (ci == null || co == null || _selectedRoomTypeId == null) return 0;
    final nights = co.difference(ci).inDays;
    if (nights <= 0) return 0;
    
    final roomType = roomTypes.firstWhere((r) => r['id'] == _selectedRoomTypeId, orElse: () => {});
    if (roomType.isEmpty) return 0;
    
    final basePrice = roomType['basePrice'] is num 
        ? (roomType['basePrice'] as num).toDouble() 
        : (double.tryParse(roomType['basePrice']?.toString() ?? '') ?? 0.0);
    
    final name = (roomType['name']?.toString() ?? '').toLowerCase();
    final tier = name.contains('single') ? 1 : name.contains('double') ? 2 : 3;
    
    double mealSurcharge = 0;
    switch (_selectedMealPlan) {
      case 'bnb': mealSurcharge = 2000.0 * tier; break;
      case 'half-board': mealSurcharge = 4000.0 * tier; break;
      case 'full-board': mealSurcharge = 6000.0 * tier; break;
      case 'room-only':
      default:
        mealSurcharge = 0;
    }
    
    if (name.contains('honeymoon') || name.contains('family')) {
      mealSurcharge = 0;
    }
    
    final roomRate = basePrice + mealSurcharge;
    final subtotal = roomRate * nights;
    final taxAmount = subtotal * 0.12;
    final serviceCharge = subtotal * 0.1;
    return subtotal + taxAmount + serviceCharge;
  }

  @override
  Widget build(BuildContext context) {
    final roomTypesAsync = ref.watch(roomTypesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Booking #${widget.booking.id}'),
      ),
      body: _isSubmitting
          ? const LoadingIndicator(message: 'Updating booking...')
          : roomTypesAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading room types...'),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (types) {
                // Ensure initial roomTypeId exists in types, if not reset or keep
                bool typeExists = types.any((t) => (int.tryParse(t['id'].toString()) ?? -1) == _selectedRoomTypeId);
                if (!typeExists && types.isNotEmpty) {
                  _selectedRoomTypeId = int.tryParse(types.first['id'].toString());
                }

                return Form(
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
                          child: Text(_currentStep == 5 ? 'Save Changes' : 'Continue'),
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
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextFormField(
                          controller: _firstNameCtrl,
                          decoration: const InputDecoration(labelText: 'First Name *', border: OutlineInputBorder()),
                          validator: (val) => val == null || val.trim().isEmpty ? 'First name is required' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _lastNameCtrl,
                          decoration: const InputDecoration(labelText: 'Last Name *', border: OutlineInputBorder()),
                          validator: (val) => val == null || val.trim().isEmpty ? 'Last name is required' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phoneCtrl,
                          decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                          keyboardType: TextInputType.phone,
                          validator: (val) {
                            if (val != null && val.trim().isNotEmpty && val.trim().length < 9) {
                              return 'Enter a valid phone number';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _emailCtrl,
                          decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
                          keyboardType: TextInputType.emailAddress,
                          validator: (val) {
                            if (val != null && val.trim().isNotEmpty && !val.contains('@')) {
                              return 'Enter a valid email';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Stay Dates'),
                    isActive: _currentStep >= 1,
                    state: _currentStep > 1 ? StepState.complete : StepState.indexed,
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        OutlinedButton.icon(
                          onPressed: _selectDateRange,
                          icon: const Icon(Icons.calendar_month),
                          label: Text(_checkIn == null || _checkOut == null 
                              ? 'Select Check-in & Check-out Dates' 
                              : '${DateFormat('dd MMM yyyy').format(_checkIn ?? DateTime.now())} - ${DateFormat('dd MMM yyyy').format(_checkOut ?? DateTime.now())}'),
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
                    content: DropdownButtonFormField<int>(
                      decoration: const InputDecoration(labelText: 'Room Type *', border: OutlineInputBorder()),
                      validator: (val) => val == null ? 'Please select a room type' : null,
                      initialValue: _selectedRoomTypeId,
                      items: types.asMap().entries.map((entry) {
                        final index = entry.key;
                        final t = entry.value;
                        int parsedId = -(index + 1);
                        if (t['id'] != null) {
                          parsedId = int.tryParse(t['id'].toString()) ?? parsedId;
                        }
                        return DropdownMenuItem<int>(
                          value: parsedId,
                          child: Text(t['name']?.toString() ?? 'Unknown Room'),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedRoomTypeId = val),
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
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedMealPlan = val);
                      },
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
                            mainAxisSize: MainAxisSize.min,
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
                            mainAxisSize: MainAxisSize.min,
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
                    title: const Text('Rate Summary'),
                    isActive: _currentStep >= 5,
                    state: _currentStep > 5 ? StepState.complete : StepState.indexed,
                    content: Builder(
                      builder: (context) {
                        final ci = _checkIn;
                        final co = _checkOut;
                        final nights = ci != null && co != null ? co.difference(ci).inDays : 0;
                        final total = _calculateTotal(types);
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ListTile(
                              title: const Text('Nights'),
                              trailing: Text('$nights'),
                            ),
                            ListTile(
                              title: const Text('New Estimated Total'),
                              trailing: Text('LKR ${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                            ),
                            ListTile(
                              title: const Text('Current Total Amount'),
                              trailing: Text('LKR ${widget.booking.totalAmount.toStringAsFixed(2)}'),
                            ),
                          ],
                        );
                      }
                    ),
                  ),
                ],
              ),
            );
          },
        ),
    );
  }
}
