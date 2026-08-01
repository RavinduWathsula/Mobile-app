import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/utils/formatters.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & Overview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(dashboardStatsProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: statsAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading business metrics...'),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading metrics',
          description: err.toString(),
          onRetry: () => ref.refresh(dashboardStatsProvider),
        ),
        data: (stats) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Daily Revenue Metric', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Text(
                      Formatters.formatCurrency(stats.revenueToday),
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.teal),
                    ),
                    const SizedBox(height: 4),
                    Text('Pending Unpaid Invoices: ${stats.pendingPayments}', style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Room Inventory Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const Divider(),
                    Text('Total Rooms: ${stats.totalRooms}'),
                    Text('Occupied Rooms: ${stats.occupiedRooms}'),
                    Text('Available Rooms: ${stats.availableRooms}'),
                    Text('Dirty Rooms: ${stats.dirtyRooms}'),
                    Text('Maintenance Rooms: ${stats.maintenanceRooms}'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
