import 'package:intl/intl.dart';

class CurrencyFormatter {
  static String format(double amount) {
    final formatter = NumberFormat.currency(
      symbol: 'LKR ',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
}
