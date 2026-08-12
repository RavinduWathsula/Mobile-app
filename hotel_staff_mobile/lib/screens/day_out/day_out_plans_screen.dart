import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/day_out_model.dart';
import '../../providers/day_out_provider.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import 'package:go_router/go_router.dart';

class DayOutPlansScreen extends ConsumerStatefulWidget {
  const DayOutPlansScreen({super.key});

  @override
  ConsumerState<DayOutPlansScreen> createState() => _DayOutPlansScreenState();
}

class _DayOutPlansScreenState extends ConsumerState<DayOutPlansScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Day Out Plans'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Plans'),
            Tab(text: 'Bookings'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/more/day_out/create');
        },
        icon: const Icon(Icons.add),
        label: const Text('New Reservation'),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPlansList(),
          _buildBookingsList(),
        ],
      ),
    );
  }

  Widget _buildPlansList() {
    final plansAsync = ref.watch(dayOutPlansProvider);
    return plansAsync.when(
      loading: () => const LoadingIndicator(message: 'Loading plans...'),
      error: (err, stack) => EmptyStateView(
        title: 'Error',
        description: err.toString(),
        onRetry: () => ref.refresh(dayOutPlansProvider),
      ),
      data: (plans) {
        if (plans.isEmpty) {
          return const EmptyStateView(title: 'No Plans Found', description: 'There are no active day out plans.');
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: plans.length,
          itemBuilder: (context, index) {
            final plan = plans[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(plan.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Text(plan.description),
                    const SizedBox(height: 8),
                    Text('Adult: Rs.${plan.adultPrice} | Child: Rs.${plan.childPrice}'),
                    const SizedBox(height: 4),
                    Text('Schedule: ${plan.schedule} (${plan.timing})'),
                  ],
                ),
                isThreeLine: true,
                trailing: Chip(
                  label: Text(plan.status.toUpperCase(), style: const TextStyle(fontSize: 10)),
                  backgroundColor: plan.status == 'active' ? Colors.green.shade100 : Colors.grey.shade200,
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBookingsList() {
    final bookingsAsync = ref.watch(dayOutBookingsProvider);
    return bookingsAsync.when(
      loading: () => const LoadingIndicator(message: 'Loading bookings...'),
      error: (err, stack) => EmptyStateView(
        title: 'Error',
        description: err.toString(),
        onRetry: () => ref.refresh(dayOutBookingsProvider),
      ),
      data: (bookings) {
        if (bookings.isEmpty) {
          return const EmptyStateView(title: 'No Bookings', description: 'No reservations found.');
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final booking = bookings[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(booking.guestName, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Plan: ${booking.planName}'),
                    Text('Date: ${booking.bookingDate}'),
                    Text('${booking.adults} Adults, ${booking.children} Children'),
                    Text('Total: Rs.${booking.totalAmount}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                trailing: Chip(
                  label: Text(booking.status.toUpperCase(), style: const TextStyle(fontSize: 10)),
                  backgroundColor: booking.status == 'confirmed' ? Colors.purple.shade100 : Colors.orange.shade100,
                ),
                isThreeLine: true,
              ),
            );
          },
        );
      },
    );
  }
}
