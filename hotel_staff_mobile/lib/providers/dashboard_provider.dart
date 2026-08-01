import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_stats_model.dart';
import 'services_provider.dart';

final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStatsModel>((ref) async {
  final repo = ref.watch(reportsRepositoryProvider);
  return await repo.getDashboardStats();
});
