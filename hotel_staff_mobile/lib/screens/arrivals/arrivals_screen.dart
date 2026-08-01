import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../bookings/booking_detail_screen.dart';

class ArrivalsScreen extends ConsumerWidget {
  const ArrivalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arrivalsAsync = ref.watch(todayArrivalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Arrivals"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(todayArrivalsProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: arrivalsAsync.when(
        loading: () => const LoadingIndicator(message: "Loading today's arrivals..."),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading arrivals',
          description: err.toString(),
          onRetry: () => ref.refresh(todayArrivalsProvider),
        ),
        data: (arrivals) {
          if (arrivals.isEmpty) {
            return const EmptyStateView(
              icon: Icons.flight_land,
              title: 'No Expected Arrivals',
              description: 'There are no pending arrivals scheduled for today.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: arrivals.length,
            itemBuilder: (context, index) {
              final booking = arrivals[index];
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
