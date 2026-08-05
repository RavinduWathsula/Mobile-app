import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import 'booking_detail_screen.dart';
import 'create_booking_screen.dart';

class BookingsListScreen extends ConsumerWidget {
  const BookingsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsListProvider);
    final currentStatus = ref.watch(bookingFilterStatusProvider);

    final statuses = [
      {'label': 'All', 'value': null},
      {'label': 'Confirmed', 'value': 'confirmed'},
      {'label': 'Checked In', 'value': 'checked_in'},
      {'label': 'Checked Out', 'value': 'checked_out'},
      {'label': 'Cancelled', 'value': 'cancelled'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings & Reservations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(bookingsListProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateBookingScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Booking'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by booking ref or guest name...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (val) {
                ref.read(bookingSearchQueryProvider.notifier).state = val;
              },
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: statuses.length,
              itemBuilder: (context, index) {
                final status = statuses[index];
                final isSelected = currentStatus == status['value'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(status['label'] as String),
                    selected: isSelected,
                    onSelected: (selected) {
                      ref.read(bookingFilterStatusProvider.notifier).state = 
                        selected ? status['value'] as String? : null;
                    },
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.refresh(bookingsListProvider.future),
              child: bookingsAsync.when(
                loading: () => const LoadingIndicator(message: 'Fetching reservations...'),
                error: (err, stack) => ListView(
                  children: [
                    EmptyStateView(
                      title: 'Error loading bookings',
                      description: err.toString(),
                      onRetry: () => ref.refresh(bookingsListProvider),
                    ),
                  ],
                ),
                data: (bookings) {
                  if (bookings.isEmpty) {
                    return ListView(
                      children: const [
                        EmptyStateView(
                          icon: Icons.bookmark_border,
                          title: 'No Bookings Found',
                          description: 'No active or upcoming reservations match your query.',
                        ),
                      ],
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: bookings.length,
                    itemBuilder: (context, index) {
                      final booking = bookings[index];
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
            ),
          ),
        ],
      ),
    );
  }
}
