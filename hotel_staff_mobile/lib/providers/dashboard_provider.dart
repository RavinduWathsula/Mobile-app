import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_stats_model.dart';
import 'services_provider.dart';

class ActivityItem {
  final String title;
  final String description;
  final String time;
  final String type; // 'checkin', 'checkout', 'housekeeping', 'restaurant', 'booking'

  ActivityItem({
    required this.title,
    required this.description,
    required this.time,
    required this.type,
  });
}

final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStatsModel>((ref) async {
  final repo = ref.watch(reportsRepositoryProvider);
  return await repo.getDashboardStats();
});

final activeOrdersCountProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final repo = ref.watch(restaurantRepositoryProvider);
    final orders = await repo.getOrders(active: true);
    return orders.length;
  } catch (_) {
    return 0;
  }
});

final recentActivityProvider = FutureProvider.autoDispose<List<ActivityItem>>((ref) async {
  final activities = <ActivityItem>[];

  try {
    final stats = await ref.watch(dashboardStatsProvider.future);

    if (stats.todayArrivals > 0) {
      activities.add(
        ActivityItem(
          title: 'Guest Check-ins Scheduled',
          description: '${stats.todayArrivals} arrivals confirmed for today',
          time: 'Today',
          type: 'checkin',
        ),
      );
    }

    if (stats.todayCheckouts > 0) {
      activities.add(
        ActivityItem(
          title: 'Guest Departures Pending',
          description: '${stats.todayCheckouts} checkouts scheduled today',
          time: 'Today',
          type: 'checkout',
        ),
      );
    }

    if (stats.dirtyRooms > 0) {
      activities.add(
        ActivityItem(
          title: 'Housekeeping Queue',
          description: '${stats.dirtyRooms} rooms waiting to be cleaned',
          time: 'In Progress',
          type: 'housekeeping',
        ),
      );
    }
  } catch (_) {}

  // Fallback activity items if list is short
  if (activities.isEmpty) {
    activities.addAll([
      ActivityItem(
        title: 'System Operational',
        description: 'Sawingir Hills HMS synchronized',
        time: 'Just now',
        type: 'booking',
      ),
    ]);
  }

  return activities;
});
