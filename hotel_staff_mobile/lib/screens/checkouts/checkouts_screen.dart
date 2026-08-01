import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../bookings/booking_detail_screen.dart';

class CheckoutsScreen extends ConsumerWidget {
  const CheckoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkoutsAsync = ref.watch(todayCheckoutsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Checkouts"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(todayCheckoutsProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: checkoutsAsync.when(
        loading: () => const LoadingIndicator(message: "Loading today's checkouts..."),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading checkouts',
          description: err.toString(),
          onRetry: () => ref.refresh(todayCheckoutsProvider),
        ),
        data: (checkouts) {
          if (checkouts.isEmpty) {
            return const EmptyStateView(
              icon: Icons.flight_takeoff,
              title: 'No Expected Checkouts',
              description: 'There are no in-house guests scheduled for checkout today.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: checkouts.length,
            itemBuilder: (context, index) {
              final booking = checkouts[index];
              return BookingCard(
                booking: booking,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BookingDetailScreen(bookingId: booking.id),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
