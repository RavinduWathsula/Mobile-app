import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/day_out_model.dart';
import '../repositories/day_out_repository.dart';

final dayOutRepositoryProvider = Provider<DayOutRepository>((ref) {
  return DayOutRepository();
});

final dayOutPlansProvider = FutureProvider.autoDispose<List<DayOutPlan>>((ref) async {
  final repo = ref.watch(dayOutRepositoryProvider);
  return await repo.getPlans();
});

final dayOutBookingsProvider = FutureProvider.autoDispose<List<DayOutBooking>>((ref) async {
  final repo = ref.watch(dayOutRepositoryProvider);
  return await repo.getBookings();
});
