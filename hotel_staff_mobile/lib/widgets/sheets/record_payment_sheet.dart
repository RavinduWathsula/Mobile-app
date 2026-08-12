import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/services_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../models/booking_request_models.dart';
import '../../models/booking_model.dart';

class RecordPaymentSheet extends ConsumerStatefulWidget {
  final BookingModel booking;

  const RecordPaymentSheet({super.key, required this.booking});

  static Future<void> show(BuildContext context, BookingModel booking) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => RecordPaymentSheet(booking: booking),
    );
  }

  @override
  ConsumerState<RecordPaymentSheet> createState() => _RecordPaymentSheetState();
}

class _RecordPaymentSheetState extends ConsumerState<RecordPaymentSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountCtrl;
  final _notesCtrl = TextEditingController();
  String _paymentMethod = 'cash';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _amountCtrl = TextEditingController(text: widget.booking.balanceDue.toStringAsFixed(2));
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    
    try {
      final amount = double.parse(_amountCtrl.text.trim());
      final request = PaymentRequest(
        amount: amount,
        paymentMethod: _paymentMethod,
        notes: _notesCtrl.text.trim(),
      );

      final repo = ref.read(bookingsRepositoryProvider);
      await repo.recordPayment(widget.booking.id, request);

      ref.invalidate(bookingsListProvider);
      ref.invalidate(bookingDetailProvider(widget.booking.id));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment recorded successfully')),
        );
        Navigator.pop(context); // Close the sheet
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset, left: 16, right: 16, top: 16),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Record Payment', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('Booking #${widget.booking.id} - Balance: LKR ${widget.booking.balanceDue.toStringAsFixed(2)}'),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (LKR) *', border: OutlineInputBorder(), prefixText: 'LKR '),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (val) {
                if (val == null || val.trim().isEmpty) return 'Required';
                final num = double.tryParse(val);
                if (num == null) return 'Invalid number';
                if (num <= 0) return 'Must be greater than 0';
                if (num > widget.booking.balanceDue + 0.01) return 'Cannot exceed balance due';
                return null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Payment Method', border: OutlineInputBorder()),
              value: _paymentMethod,
              items: const [
                DropdownMenuItem(value: 'cash', child: Text('Cash')),
                DropdownMenuItem(value: 'card', child: Text('Card')),
                DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                DropdownMenuItem(value: 'online', child: Text('Online')),
                DropdownMenuItem(value: 'room_charge', child: Text('Room Charge')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _paymentMethod = val);
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Notes (Optional)', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: _isSubmitting 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirm Payment'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
