import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/stat_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sawingir Hills Staff'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(dashboardStatsProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardStatsProvider),
        child: statsAsync.when(
          loading: () => const LoadingIndicator(message: 'Loading live dashboard...'),
          error: (err, stack) => EmptyStateView(
            title: 'Failed to load dashboard',
            description: err.toString(),
            onRetry: () => ref.refresh(dashboardStatsProvider),
          ),
          data: (stats) => ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              Text(
                'Welcome back, ${user?.fullName ?? "Staff"}!',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Department: ${user?.department ?? "Front Office"}',
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Occupancy Rate',
                      value: '${stats.occupancyRate}%',
                      icon: Icons.hotel,
                      color: Colors.blue,
                      onTap: () => context.go('/rooms'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Available Rooms',
                      value: '${stats.availableRooms}/${stats.totalRooms}',
                      icon: Icons.meeting_room,
                      color: Colors.green,
                      onTap: () => context.go('/rooms'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: "Today's Arrivals",
                      value: '${stats.todayArrivals}',
                      icon: Icons.flight_land,
                      color: Colors.orange,
                      onTap: () => context.go('/arrivals'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: "Today's Checkouts",
                      value: '${stats.todayCheckouts}',
                      icon: Icons.flight_takeoff,
                      color: Colors.purple,
                      onTap: () => context.go('/checkouts'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              StatCard(
                title: "Today's Revenue",
                value: Formatters.formatCurrency(stats.revenueToday),
                icon: Icons.payments_outlined,
                color: Colors.teal,
                onTap: () => context.go('/reports'),
              ),
              const SizedBox(height: 20),
              const Text(
                'Quick Staff Actions',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                childAspectRatio: 2.5,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.room_service),
                    label: const Text('Restaurant POS'),
                    onPressed: () => context.go('/restaurant'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.kitchen),
                    label: const Text('Kitchen KDS'),
                    onPressed: () => context.go('/kitchen'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.cleaning_services),
                    label: const Text('Housekeeping'),
                    onPressed: () => context.go('/housekeeping'),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.bookmark_add),
                    label: const Text('Bookings'),
                    onPressed: () => context.go('/bookings'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
