import 'package:intl/intl.dart';

class Formatters {
  static final currencyFormat = NumberFormat.currency(
    symbol: 'LKR ',
    decimalDigits: 2,
  );

  static String formatCurrency(dynamic amount) {
    if (amount == null) return 'LKR 0.00';
    final number = double.tryParse(amount.toString()) ?? 0.0;
    return currencyFormat.format(number);
  }

  static String formatDate(dynamic dateString) {
    if (dateString == null) return '-';
    try {
      final DateTime date = DateTime.parse(dateString.toString());
      return DateFormat('MMM dd, yyyy').format(date);
    } catch (_) {
      return dateString.toString();
    }
  }

  static String formatDateTime(dynamic dateString) {
    if (dateString == null) return '-';
    try {
      final DateTime date = DateTime.parse(dateString.toString());
      return DateFormat('MMM dd, yyyy hh:mm a').format(date);
    } catch (_) {
      return dateString.toString();
    }
  }

  static String formatStatusName(String raw) {
    return raw.replaceAll('_', ' ').toUpperCase();
  }
}
