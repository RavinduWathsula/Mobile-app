import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/booking_model.dart';
import 'services_provider.dart';

final bookingFilterStatusProvider = StateProvider<String?>((ref) => null);
final bookingSearchQueryProvider = StateProvider<String>((ref) => '');

final bookingsListProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final status = ref.watch(bookingFilterStatusProvider);
  final search = ref.watch(bookingSearchQueryProvider);
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getBookings(status: status, search: search);
});

final todayArrivalsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getTodayArrivals();
});

final todayCheckoutsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getTodayCheckouts();
});
