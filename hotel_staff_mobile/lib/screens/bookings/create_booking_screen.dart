import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../models/booking_request_models.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class CreateBookingScreen extends ConsumerStatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  ConsumerState<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;
  late PageController _pageController;

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
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _idNumberCtrl.dispose();
    _advanceAmountCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 0) {
      if (_firstNameCtrl.text.isEmpty || _lastNameCtrl.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill required guest details')));
        return;
      }
      
      final emailText = _emailCtrl.text.trim();
      if (emailText.isNotEmpty && !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(emailText)) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid email address')));
        return;
      }
      
      final phoneText = _phoneCtrl.text.trim();
      if (phoneText.isNotEmpty && !RegExp(r'^\d{10}$').hasMatch(phoneText)) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Phone number must be exactly 10 digits')));
        return;
      }
      
      final idText = _idNumberCtrl.text.trim();
      if (idText.isNotEmpty && !RegExp(r'^\d+$').hasMatch(idText)) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ID / Passport must contain only numbers')));
        return;
      }
    } else if (_currentStep == 1) {
      if (_checkIn == null || _checkOut == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select check-in and check-out dates')));
        return;
      }
    } else if (_currentStep == 2) {
      if (_selectedRoomTypeId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a room type')));
        return;
      }
    }

    if (_currentStep < 5) {
      setState(() => _currentStep++);
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submitForm();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
    }
  }

  void _submitForm() async {
    if (_isSubmitting) return;
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
      final roomTypes = ref.read(roomTypesProvider).value ?? [];
      final totalAmount = _calculateTotal(roomTypes);

      final advanceStr = _advanceAmountCtrl.text.trim();
      double advance = 0.0;
      if (advanceStr.isNotEmpty) {
        if (!RegExp(r'^\d+(\.\d+)?$').hasMatch(advanceStr)) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Advance payment must contain only numbers.'), backgroundColor: Colors.red),
            );
            setState(() => _isSubmitting = false);
          }
          return;
        }

        advance = double.tryParse(advanceStr) ?? 0;
        if (advance > totalAmount) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Advance payment cannot exceed the total amount.'), backgroundColor: Colors.red),
            );
            setState(() => _isSubmitting = false);
          }
          return;
        }
      }
      
      final request = CreateBookingRequest(
        guest: guest,
        checkIn: dateFormat.format(_checkIn!),
        checkOut: dateFormat.format(_checkOut!),
        roomTypeId: _selectedRoomTypeId,
        adults: _adults,
        children: _children,
        mealPlan: _selectedMealPlan,
        source: 'walk_in',
        totalAmount: totalAmount,
      );

      final repo = ref.read(bookingsRepositoryProvider);
      final newBooking = await repo.createBooking(request);

      if (advance > 0) {
        await repo.recordPayment(
          newBooking.id,
          PaymentRequest(amount: advance, paymentMethod: _paymentMethod),
        );
      }

      ref.invalidate(bookingsListProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(recentActivityProvider);
      ref.invalidate(todayArrivalsProvider);
      ref.invalidate(roomsListProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully!'), backgroundColor: AppColors.success),
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
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _checkIn = picked.start;
        _checkOut = picked.end;
      });
    }
  }

  double _calculateTotal(List<Map<String, dynamic>> roomTypes) {
    if (_checkIn == null || _checkOut == null || _selectedRoomTypeId == null) return 0;
    final nights = _checkOut!.difference(_checkIn!).inDays;
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
    
    final roomRate = basePrice + mealSurcharge;
    final subtotal = roomRate * nights;
    final taxAmount = subtotal * 0.12;
    final serviceCharge = subtotal * 0.1;
    return subtotal + taxAmount + serviceCharge;
  }

  Widget _buildProgressIndicator() {
    final steps = ['Guest', 'Dates', 'Room', 'Guests', 'Meal', 'Confirm'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.primary,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 8)],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(steps.length, (index) {
          final isPast = index < _currentStep;
          final isActive = index == _currentStep;
          return Column(
            mainAxisSize: MainAxisSize.min, // CRITICAL FIX: prevents infinite height in Row
            children: [
              Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isPast || isActive ? Colors.white : Colors.white.withValues(alpha: 0.3),
                  border: Border.all(color: isActive ? Colors.amber : Colors.transparent, width: 2),
                ),
                alignment: Alignment.center,
                child: isPast 
                  ? const Icon(Icons.check, color: AppColors.primary, size: 16)
                  : Text('${index + 1}', style: TextStyle(color: isActive ? AppColors.primary : Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              const SizedBox(height: 4),
              Text(steps[index], style: TextStyle(color: isActive || isPast ? Colors.white : Colors.white70, fontSize: 9, fontWeight: FontWeight.bold)),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildStepCard(String title, Widget child) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 600),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min, // Prevents vertical overflow
            children: [
              Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 24),
              child,
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final roomTypesAsync = ref.watch(roomTypesProvider);
    final isSmallScreen = MediaQuery.of(context).size.width < 400;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('New Reservation', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isSubmitting
          ? const LoadingIndicator(message: 'Finalizing reservation...')
          : roomTypesAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading reservation system...'),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (types) {
                return Column(
                  children: [
                    _buildProgressIndicator(),
                    Expanded(
                      child: PageView(
                        controller: _pageController,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          // 0: Guest Info
                          _buildStepCard('Guest Information', Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: _buildTextField('First Name *', _firstNameCtrl, Icons.person)),
                                  const SizedBox(width: 12),
                                  Expanded(child: _buildTextField('Last Name *', _lastNameCtrl, null)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildTextField('Email Address', _emailCtrl, Icons.email, type: TextInputType.emailAddress),
                              const SizedBox(height: 16),
                              _buildTextField('Phone Number', _phoneCtrl, Icons.phone, type: TextInputType.phone),
                              const SizedBox(height: 16),
                              _buildTextField('ID / Passport Number', _idNumberCtrl, Icons.badge),
                            ],
                          )),

                          // 1: Dates
                          _buildStepCard('Stay Duration', Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              InkWell(
                                onTap: _selectDateRange,
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
                                    borderRadius: BorderRadius.circular(16),
                                    color: AppColors.primary.withValues(alpha: 0.05),
                                  ),
                                  child: Column(
                                    children: [
                                      const Icon(Icons.calendar_month, size: 40, color: AppColors.primary),
                                      const SizedBox(height: 16),
                                      Text(
                                        _checkIn == null || _checkOut == null 
                                          ? 'Tap to Select Dates' 
                                          : '${DateFormat('MMM dd').format(_checkIn!)} → ${DateFormat('MMM dd').format(_checkOut!)}',
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              if (_checkIn != null && _checkOut != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 24),
                                  child: Wrap(
                                    alignment: WrapAlignment.center,
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    children: [
                                      const Icon(Icons.nightlight_round, color: Colors.indigo),
                                      const SizedBox(width: 8),
                                      Text('${_checkOut!.difference(_checkIn!).inDays} Nights Selected', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                            ],
                          )),

                          // 2: Room Type
                          _buildStepCard('Select Room Type', Column(
                            mainAxisSize: MainAxisSize.min,
                            children: types.asMap().entries.map((entry) {
                              final index = entry.key;
                              final t = entry.value;
                              int parsedId = -(index + 1);
                              if (t['id'] != null) parsedId = int.tryParse(t['id'].toString()) ?? parsedId;
                              
                              final isSelected = _selectedRoomTypeId == parsedId;
                              
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: InkWell(
                                  onTap: () => setState(() => _selectedRoomTypeId = parsedId),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: isSelected ? AppColors.primary : Colors.grey.shade300, width: isSelected ? 2 : 1),
                                      borderRadius: BorderRadius.circular(12),
                                      color: isSelected ? AppColors.primary.withValues(alpha: 0.05) : Colors.white,
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Row(
                                            children: [
                                              Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: isSelected ? AppColors.primary : Colors.grey, size: 20),
                                              const SizedBox(width: 12),
                                              Expanded(child: Text(t['name']?.toString() ?? 'Unknown Room', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis)),
                                            ],
                                          ),
                                        ),
                                        if (t['basePrice'] != null)
                                          Text(Formatters.formatCurrency(double.tryParse(t['basePrice'].toString()) ?? 0), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          )),

                          // 3: Guests
                          _buildStepCard('Who is staying?', isSmallScreen ? 
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildGuestCounter('Adults', Icons.person, _adults, (val) => setState(() => _adults = val), 1),
                                const SizedBox(height: 16),
                                _buildGuestCounter('Children', Icons.child_care, _children, (val) => setState(() => _children = val), 0),
                              ]
                            )
                            : Row(
                              children: [
                                Expanded(child: _buildGuestCounter('Adults', Icons.person, _adults, (val) => setState(() => _adults = val), 1)),
                                const SizedBox(width: 16),
                                Expanded(child: _buildGuestCounter('Children', Icons.child_care, _children, (val) => setState(() => _children = val), 0)),
                              ],
                            )
                          ),

                          // 4: Meal Plan
                          _buildStepCard('Meal Plan', Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildMealPlanOption('room-only', 'Room Only', 'No meals included'),
                              _buildMealPlanOption('bnb', 'Bed & Breakfast', 'Breakfast included'),
                              _buildMealPlanOption('half-board', 'Half Board', 'Breakfast and Dinner included'),
                              _buildMealPlanOption('full-board', 'Full Board', 'All meals included'),
                            ],
                          )),

                          // 5: Summary & Payment
                          _buildStepCard('Review & Payment', Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                                ),
                                child: Column(
                                  children: [
                                    _summaryRow('Guest', '${_firstNameCtrl.text} ${_lastNameCtrl.text}'),
                                    const Divider(),
                                    _summaryRow('Dates', _checkIn != null ? '${DateFormat('MMM dd').format(_checkIn!)} - ${DateFormat('MMM dd').format(_checkOut!)}' : ''),
                                    const Divider(),
                                    _summaryRow('Total Cost', Formatters.formatCurrency(_calculateTotal(types)), isTotal: true),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 32),
                              const Text('Advance Payment (Optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 16),
                              _buildTextField('Amount (LKR)', _advanceAmountCtrl, Icons.payments, type: const TextInputType.numberWithOptions(decimal: true)),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                decoration: InputDecoration(
                                  labelText: 'Payment Method',
                                  prefixIcon: const Icon(Icons.credit_card),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                initialValue: _paymentMethod,
                                items: const [
                                  DropdownMenuItem(value: 'cash', child: Text('Cash')),
                                  DropdownMenuItem(value: 'card', child: Text('Card')),
                                  DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                                ],
                                onChanged: (val) {
                                  if (val != null) setState(() => _paymentMethod = val);
                                },
                              ),
                            ],
                          )),
                        ],
                      ),
                    ),
                    
                    // Bottom Navigation
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton.icon(
                            onPressed: _prevStep,
                            icon: const Icon(Icons.arrow_back, size: 18),
                            label: Text(_currentStep == 0 ? 'Cancel' : 'Back', style: const TextStyle(fontSize: 14)),
                          ),
                          ElevatedButton(
                            onPressed: _nextStep,
                            style: ElevatedButton.styleFrom(
                              minimumSize: Size.zero, // Override global infinite width
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(_currentStep == 5 ? 'CONFIRM' : 'NEXT', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
                                if (_currentStep < 5) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.arrow_forward, size: 16)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }

  Widget _buildGuestCounter(String label, IconData icon, int value, Function(int) onChanged, int min) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Icon(icon, size: 32, color: Colors.grey),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () { if (value > min) onChanged(value - 1); }),
              Text('$value', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => onChanged(value + 1)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData? icon, {TextInputType type = TextInputType.text}) {
    return TextFormField(
      controller: controller,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: icon != null ? Icon(icon, color: Colors.grey) : null,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
    );
  }

  Widget _buildMealPlanOption(String value, String title, String subtitle) {
    final isSelected = _selectedMealPlan == value;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => setState(() => _selectedMealPlan = value),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: isSelected ? AppColors.primary : Colors.grey.shade300, width: isSelected ? 2 : 1),
            borderRadius: BorderRadius.circular(12),
            color: isSelected ? AppColors.primary.withValues(alpha: 0.05) : Colors.white,
          ),
          child: Row(
            children: [
              Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: isSelected ? AppColors.primary : Colors.grey),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: isTotal ? 18 : 16)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: isTotal ? AppColors.primary : Colors.black87, fontSize: isTotal ? 24 : 16)),
        ],
      ),
    );
  }
}
